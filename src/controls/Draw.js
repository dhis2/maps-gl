import { createElement } from '../utils/dom.js'
import './Measure.css'

const SOURCE_ID = 'draw'
const VERTICES_LAYER = 'draw-vertices'
const MIDPOINTS_LAYER = 'draw-midpoints'
const LINE_LAYER = 'draw-line'
const GUIDE_LAYER = 'draw-guide'
const LAYER_IDS = [LINE_LAYER, GUIDE_LAYER, MIDPOINTS_LAYER, VERTICES_LAYER]
const HANDLE_LAYERS = [VERTICES_LAYER, MIDPOINTS_LAYER]
const COLOR = '#ffa500'

const KIND_VERTEX = 'vertex'
const KIND_MIDPOINT = 'midpoint'
const KIND_LINE = 'line'
const KIND_GUIDE = 'guide'

export const DRAW_TYPE_POINT = 'point'
export const DRAW_TYPE_LINE = 'line'

const isSameCoordinate = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

const toCoordinate = ({ lngLat }) => [lngLat.lng, lngLat.lat]

const pointFeature = (coordinates, properties) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties,
})

const lineFeature = (coordinates, kind) => ({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
    properties: { kind },
})

// Lets the app draw a point or a line, or edit an existing one, and returns
// the geometry in onFinish. Uses the same panel as the measure control.
// Vertices can be dragged, removed with a click, and added by dragging the
// midpoint handles of a line.
class Draw {
    constructor(
        map,
        { type = DRAW_TYPE_LINE, start, geometry, onFinish, onCancel }
    ) {
        this._map = map
        this._type = type
        this._isEdit = !!geometry
        this._mouse = null
        this._drag = null
        this._onFinish = onFinish
        this._onCancel = onCancel

        if (geometry) {
            this._vertices =
                geometry.type === 'Point'
                    ? [[...geometry.coordinates]]
                    : geometry.coordinates.map(c => [...c])
        } else {
            this._vertices = start ? [start] : []
        }

        const mapgl = map.getMapGL()
        this.locale = mapgl._getUIString.bind(mapgl)
    }

    start() {
        const mapgl = this._map.getMapGL()

        this._doubleClickZoom = mapgl.doubleClickZoom.isEnabled()
        mapgl.doubleClickZoom.disable()

        if (mapgl.isStyleLoaded()) {
            this._setupMap()
        } else {
            mapgl.once('styledata', this._setupMap)
        }

        mapgl.on('click', this._onClick)
        mapgl.on('dblclick', this._onDoubleClick)
        mapgl.on('mousedown', this._onMouseDown)
        mapgl.on('mousemove', this._onMouseMove)
        mapgl.on('mouseup', this._onMouseUp)
        document.addEventListener('keydown', this._onKeyDown)
        this._map.on('layersort', this._onLayerSort)

        mapgl.getCanvas().style.cursor = 'crosshair'

        this._setupPanel()
    }

    finish = () => {
        const isLine = this._type === DRAW_TYPE_LINE

        if (isLine ? this._vertices.length < 2 : !this._vertices.length) {
            return
        }

        const geometry = isLine
            ? { type: 'LineString', coordinates: [...this._vertices] }
            : { type: 'Point', coordinates: this._vertices[0] }

        this.remove()
        this._onFinish?.(geometry)
    }

    cancel = () => {
        this.remove()
        this._onCancel?.()
    }

    remove() {
        const mapgl = this._map.getMapGL()

        if (!mapgl) {
            return
        }

        LAYER_IDS.forEach(id => mapgl.getLayer(id) && mapgl.removeLayer(id))

        if (mapgl.getSource(SOURCE_ID)) {
            mapgl.removeSource(SOURCE_ID)
        }

        mapgl.off('styledata', this._setupMap)
        mapgl.off('click', this._onClick)
        mapgl.off('dblclick', this._onDoubleClick)
        mapgl.off('mousedown', this._onMouseDown)
        mapgl.off('mousemove', this._onMouseMove)
        mapgl.off('mouseup', this._onMouseUp)
        document.removeEventListener('keydown', this._onKeyDown)
        this._map.off('layersort', this._onLayerSort)

        if (this._doubleClickZoom) {
            mapgl.doubleClickZoom.enable()
        }

        if (this._drag) {
            mapgl.dragPan.enable()
            this._drag = null
        }

        mapgl.getCanvas().style.cursor = ''

        if (this._panel) {
            this._panel.remove()
            this._panel = null
        }
    }

    getData() {
        const vertices = this._vertices
        const last = vertices[vertices.length - 1]
        const features = vertices.map((coordinates, index) =>
            pointFeature(coordinates, { kind: KIND_VERTEX, index })
        )

        if (this._type === DRAW_TYPE_LINE && vertices.length > 1) {
            features.push(lineFeature(vertices, KIND_LINE))

            // Index is where a dragged midpoint is inserted
            for (let i = 1; i < vertices.length; i++) {
                const [x1, y1] = vertices[i - 1]
                const [x2, y2] = vertices[i]
                features.push(
                    pointFeature([(x1 + x2) / 2, (y1 + y2) / 2], {
                        kind: KIND_MIDPOINT,
                        index: i,
                    })
                )
            }
        }

        // No guide while editing, the line may end anywhere
        if (
            this._type === DRAW_TYPE_LINE &&
            !this._isEdit &&
            !this._drag &&
            last &&
            this._mouse
        ) {
            features.push(lineFeature([last, this._mouse], KIND_GUIDE))
        }

        return { type: 'FeatureCollection', features }
    }

    _setupMap = () => {
        const mapgl = this._map.getMapGL()

        mapgl.addSource(SOURCE_ID, { type: 'geojson', data: this.getData() })

        mapgl.addLayer({
            id: LINE_LAYER,
            type: 'line',
            source: SOURCE_ID,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': COLOR, 'line-width': 3 },
            filter: ['==', 'kind', KIND_LINE],
        })

        mapgl.addLayer({
            id: GUIDE_LAYER,
            type: 'line',
            source: SOURCE_ID,
            paint: {
                'line-color': COLOR,
                'line-width': 2,
                'line-dasharray': [2, 2],
            },
            filter: ['==', 'kind', KIND_GUIDE],
        })

        mapgl.addLayer({
            id: MIDPOINTS_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            paint: {
                'circle-radius': 3.5,
                'circle-color': '#fff',
                'circle-stroke-color': COLOR,
                'circle-stroke-width': 1.5,
            },
            filter: ['==', 'kind', KIND_MIDPOINT],
        })

        mapgl.addLayer({
            id: VERTICES_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            paint: {
                'circle-radius': 5,
                'circle-color': COLOR,
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 1,
            },
            filter: ['==', 'kind', KIND_VERTEX],
        })
    }

    _getTitle() {
        const isLine = this._type === DRAW_TYPE_LINE

        if (this._isEdit) {
            return isLine ? 'DrawControl.EditLine' : 'DrawControl.MovePoint'
        }
        return isLine ? 'DrawControl.DrawLine' : 'DrawControl.DrawPoint'
    }

    _getHelp() {
        const isLine = this._type === DRAW_TYPE_LINE

        if (this._isEdit) {
            return isLine
                ? 'DrawControl.EditLineHelp'
                : 'DrawControl.MovePointHelp'
        }
        return isLine
            ? 'DrawControl.ClickToAddPoints'
            : 'DrawControl.ClickToPlacePoint'
    }

    _setupPanel() {
        const locale = this.locale

        this._panel = createElement({
            element: 'div',
            className: 'dhis2-map-ctrl-measure-result',
            appendTo: this._map.getMapGL().getContainer(),
        })

        createElement({
            element: 'div',
            className: 'dhis2-map-ctrl-measure-header',
            text: locale(this._getTitle()),
            appendTo: this._panel,
        })

        createElement({
            element: 'p',
            text: locale(this._getHelp()),
            appendTo: this._panel,
        })

        const actions = createElement({
            element: 'div',
            className: 'dhis2-map-ctrl-measure-actions',
            appendTo: this._panel,
        })

        createElement({
            element: 'span',
            className: 'dhis2-map-ctrl-measure-cancel',
            text: locale('DrawControl.Cancel'),
            appendTo: actions,
        }).addEventListener('click', this.cancel)

        // A new point is done on the first click, no need to finish
        if (this._type === DRAW_TYPE_LINE || this._isEdit) {
            createElement({
                element: 'span',
                className: 'dhis2-map-ctrl-measure-finish',
                text: locale('DrawControl.Finish'),
                appendTo: actions,
            }).addEventListener('click', this.finish)
        }
    }

    _update() {
        this._map.getMapGL().getSource(SOURCE_ID)?.setData(this.getData())
    }

    _getHandle(evt) {
        const mapgl = this._map.getMapGL()
        const layers = HANDLE_LAYERS.filter(id => mapgl.getLayer(id))

        if (!layers.length) {
            return null
        }

        const [feature] = mapgl.queryRenderedFeatures(evt.point, { layers })
        return feature ? feature.properties : null
    }

    _onMouseDown = evt => {
        const handle = this._getHandle(evt)

        if (!handle) {
            return
        }

        // Stop the map from panning while a handle is dragged
        evt.preventDefault()
        this._map.getMapGL().dragPan.disable()

        const index = Number(handle.index)
        const isMidpoint = handle.kind === KIND_MIDPOINT

        if (isMidpoint) {
            this._vertices.splice(index, 0, toCoordinate(evt))
            this._update()
        }

        this._drag = { index, moved: isMidpoint }
    }

    _onMouseMove = evt => {
        const mapgl = this._map.getMapGL()
        this._mouse = toCoordinate(evt)

        if (this._drag) {
            this._vertices[this._drag.index] = this._mouse
            this._drag.moved = true
        } else {
            mapgl.getCanvas().style.cursor = this._getHandle(evt)
                ? 'move'
                : 'crosshair'
        }

        this._update()
    }

    _onMouseUp = () => {
        if (!this._drag) {
            return
        }

        this._map.getMapGL().dragPan.enable()

        // The click that follows a drag must not add or remove a vertex
        this._skipClick = this._drag.moved
        this._drag = null
        this._update()
    }

    _onClick = evt => {
        if (this._skipClick) {
            this._skipClick = false
            return
        }

        const handle = this._getHandle(evt)
        const isLine = this._type === DRAW_TYPE_LINE

        if (handle?.kind === KIND_VERTEX) {
            // Lines keep at least 2 vertices
            if (isLine && this._vertices.length > 2) {
                this._vertices.splice(Number(handle.index), 1)
                this._update()
            }
            return
        }

        const coordinates = toCoordinate(evt)

        if (!isLine) {
            this._vertices = [coordinates]
            return this._isEdit ? this._update() : this.finish()
        }

        this._vertices.push(coordinates)
        this._update()
    }

    // A double-click also fires two clicks, so drop the duplicate vertex.
    // While editing it doesn't finish, as clicks are used to remove vertices.
    _onDoubleClick = evt => {
        evt.preventDefault()
        const vertices = this._vertices

        while (
            vertices.length > 1 &&
            isSameCoordinate(
                vertices[vertices.length - 1],
                vertices[vertices.length - 2]
            )
        ) {
            vertices.pop()
        }

        if (this._isEdit) {
            this._update()
        } else {
            this.finish()
        }
    }

    _onKeyDown = evt => {
        if (evt.key === 'Escape') {
            this.cancel()
        } else if (evt.key === 'Enter') {
            this.finish()
        }
    }

    _onLayerSort = () => {
        const mapgl = this._map.getMapGL()
        LAYER_IDS.forEach(id => mapgl.getLayer(id) && mapgl.moveLayer(id))
    }
}

export default Draw
