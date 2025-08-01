import turfArea from '@turf/area'
import bbox from '@turf/bbox'
import turfLength from '@turf/length'
import { createElement } from '../utils/dom.js'
import { featureCollection } from '../utils/geometry.js'
import { numberPrecision, kmToMiles } from '../utils/numbers.js'
import './Measure.css'

// Inspired by https://github.com/ljagis/leaflet-measure

class MeasureControl {
    constructor() {
        this._isActive = false
        this._type = 'measure'
        this._numFormat = numberPrecision(2)
    }

    addTo(map) {
        this._map = map
        const mapgl = map.getMapGL()

        this.locale = mapgl._getUIString.bind(mapgl)

        mapgl.addControl(this)
    }

    onAdd() {
        this._container = createElement({
            element: 'div',
            className: 'maplibregl-ctrl maplibregl-ctrl-group',
        })
        this._setupUI()

        return this._container
    }

    onRemove() {
        this._clearMap()
        this._button.removeEventListener('click', this._onButtonClick)
        this._container.parentNode.removeChild(this._container)

        this._map = null
    }

    _setupUI() {
        const label = this.locale('MeasureControl.MeasureDistancesAndAreas')

        this._button = createElement({
            element: 'button',
            className: 'maplibregl-ctrl-icon dhis2-map-ctrl-measure',
            text: '',
            appendTo: this._container,
        })

        this._button.type = 'button'
        this._button.setAttribute('title', label)
        this._button.setAttribute('aria-label', label)
        this._button.addEventListener('click', this._onButtonClick)
    }

    _setupMapWhenReady() {
        const mapgl = this._map.getMapGL()

        if (mapgl.isStyleLoaded()) {
            this._setupMap()
        } else {
            mapgl.once('styledata', this._setupMap)
        }
    }

    _setupMap = () => {
        const mapgl = this._map.getMapGL()

        const color = '#ffa500'

        // GeoJSON object to hold our measurement features
        this._geojson = featureCollection()

        // Used to draw a line between points
        this._linestring = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [],
            },
        }

        // Used to draw a polygon between points
        this._polygon = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [],
            },
        }

        // Add source to map
        mapgl.addSource('measure', {
            type: 'geojson',
            data: this._geojson,
        })

        // Add point styles
        mapgl.addLayer({
            id: 'measure-points',
            type: 'circle',
            source: 'measure',
            paint: {
                'circle-radius': 5,
                'circle-color': color,
            },
            filter: ['in', '$type', 'Point'],
        })

        // Add line styles
        mapgl.addLayer({
            id: 'measure-line',
            type: 'line',
            source: 'measure',
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-color': color,
                'line-width': 2.5,
            },
            filter: ['in', '$type', 'LineString'],
        })

        // Add polygon styles
        mapgl.addLayer({
            id: 'measure-polygon',
            type: 'fill',
            source: 'measure',

            paint: {
                'fill-color': color,
                'fill-opacity': 0.1,
            },
            filter: ['in', '$type', 'Polygon'],
        })

        mapgl.on('click', this._onMapClick)
        mapgl.on('mousemove', this._onMouseMove)

        this._map.on('layersort', this._onLayerSort)
    }

    _clearMap = () => {
        const mapgl = this._map.getMapGL()

        if (mapgl.getLayer('measure-points')) {
            mapgl.removeLayer('measure-points')
        }

        if (mapgl.getLayer('measure-line')) {
            mapgl.removeLayer('measure-line')
        }

        if (mapgl.getLayer('measure-polygon')) {
            mapgl.removeLayer('measure-polygon')
        }

        if (mapgl.getSource('measure')) {
            mapgl.removeSource('measure')
        }

        mapgl.off('click', this._onMapClick)
        mapgl.off('mousemove', this._onMouseMove)

        mapgl.getCanvas().style.cursor = 'grab'

        this._geojson = null
        this._linestring = null
        this._polygon = null
        this._isActive = false
    }

    _startMeasure = () => {
        const mapgl = this._map.getMapGL()
        const locale = this.locale

        this._button.classList.add('active')

        if (!this._geojson) {
            this._setupMapWhenReady()
        }

        this._distanceContainer = createElement({
            element: 'div',
            className: 'dhis2-map-ctrl-measure-result',
            text: '',
            appendTo: mapgl.getContainer(),
        })

        createElement({
            element: 'div',
            className: 'dhis2-map-ctrl-measure-header',
            text: locale('MeasureControl.MeasureDistancesAndAreas'),
            appendTo: this._distanceContainer,
        })

        this._distanceText = createElement({
            element: 'p',
            className: '',
            text: locale('MeasureControl.ClickStartMeasurement'),
            appendTo: this._distanceContainer,
        })

        this._actionsEl = createElement({
            element: 'div',
            className: 'dhis2-map-ctrl-measure-actions',
            text: '',
            appendTo: this._distanceContainer,
        })

        this._cancelEl = createElement({
            element: 'span',
            className: 'dhis2-map-ctrl-measure-cancel',
            text: locale('MeasureControl.Cancel'),
            appendTo: this._actionsEl,
        })
        this._cancelEl.addEventListener('click', this._endMeasure)

        this._finishEl = createElement({
            element: 'span',
            className: 'dhis2-map-ctrl-measure-finish',
            text: locale('MeasureControl.FinishMeasurement'),
            appendTo: this._actionsEl,
        })
        this._finishEl.addEventListener('click', this._finishMeasure)
    }

    _finishMeasure = () => {
        const mapgl = this._map.getMapGL()
        const geojson = this._geojson
        const points = geojson.features.filter(f => f.geometry.type === 'Point')
        const locale = this.locale
        const numFormat = this._numFormat

        if (points.length < 2) {
            return this._endMeasure()
        } else if (points.length > 2) {
            const lineIndex = geojson.features.findIndex(
                f => f === this._linestring
            )

            this._linestring.geometry.coordinates = [
                ...points.map(point => point.geometry.coordinates),
                points[0].geometry.coordinates,
            ]

            geojson.features[lineIndex] = this._linestring

            mapgl.getSource('measure').setData(geojson)

            const length = turfLength(this._linestring)
            const miles = kmToMiles(length)

            const perimeterText = `${locale(
                'MeasureControl.Perimeter'
            )}: ${numFormat(length)} ${locale(
                'MeasureControl.Kilometers'
            )} (${numFormat(miles)} ${locale('MeasureControl.Miles')})`

            this._distanceEl.textContent = perimeterText
        }

        this._actionsEl.innerText = ''

        this._centerEl = createElement({
            element: 'span',
            className: 'dhis2-map-ctrl-measure-center',
            text: locale(
                `MeasureControl.CenterMapOn${
                    points.length === 2 ? 'Line' : 'Area'
                }`
            ),
            appendTo: this._actionsEl,
        })
        this._centerEl.addEventListener('click', this._centerMap)

        this._deleteEl = createElement({
            element: 'span',
            className: 'dhis2-map-ctrl-measure-delete',
            text: locale('MeasureControl.Delete'),
            appendTo: this._actionsEl,
        })
        this._deleteEl.addEventListener('click', this._endMeasure)

        mapgl.off('click', this._onMapClick)
        mapgl.off('mousemove', this._onMouseMove)

        mapgl.getCanvas().style.cursor = 'grab'
    }

    _endMeasure = () => {
        this._button.classList.remove('active')
        this._clearMap()

        if (this._distanceContainer) {
            this._finishEl.removeEventListener('click', this._endMeasure)
            this._map
                .getMapGL()
                .getContainer()
                .removeChild(this._distanceContainer)
            this._distanceContainer = null
        }
    }

    _centerMap = () => {
        const [x1, y1, x2, y2] = bbox(this._geojson)

        this._map.getMapGL().fitBounds(
            [
                [x1, y1],
                [x2, y2],
            ],
            {
                padding: 100,
            }
        )
    }

    _onButtonClick = () => {
        this._isActive = !this._isActive
        this._isActive ? this._startMeasure() : this._endMeasure()
    }

    _onMapClick = evt => {
        const mapgl = this._map.getMapGL()
        const geojson = this._geojson
        const locale = this.locale
        const numFormat = this._numFormat
        let points = geojson.features.filter(f => f.geometry.type === 'Point')

        const clikedFeature = mapgl.queryRenderedFeatures(evt.point, {
            layers: ['measure-points'],
        })[0]

        // If a feature was clicked, remove it from the map
        if (clikedFeature) {
            const { id } = clikedFeature.properties
            points = points.filter(p => p.properties.id !== id)
        } else {
            points = [
                ...points,
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [evt.lngLat.lng, evt.lngLat.lat],
                    },
                    properties: {
                        id: String(new Date().getTime()),
                    },
                },
            ]
        }

        geojson.features = [...points]

        if (points.length === 1) {
            this._distanceText.innerText = locale(
                'MeasureControl.ClickNextPosition'
            )
        } else {
            this._linestring.geometry.coordinates = points.map(
                point => point.geometry.coordinates
            )

            geojson.features.push(this._linestring)

            const length = turfLength(this._linestring)
            const miles = kmToMiles(length)

            const distanceText = `${locale(
                'MeasureControl.Distance'
            )}: ${numFormat(length)} ${locale(
                'MeasureControl.Kilometers'
            )} (${numFormat(miles)} ${locale('MeasureControl.Miles')})`

            this._distanceText.innerText = ''
            this._distanceEl = createElement({
                element: 'div',
                className: 'dhis2-map-ctrl-measure-distance',
                text: distanceText,
                appendTo: this._distanceText,
            })
        }

        if (points.length > 2) {
            this._polygon.geometry.coordinates = [
                [
                    ...points.map(point => point.geometry.coordinates),
                    points[0].geometry.coordinates,
                ],
            ]

            geojson.features.push(this._polygon)

            const area = turfArea(this._polygon)
            const hectares = area / 10000
            const acres = hectares * 2.47105381

            const areaText = `${locale('MeasureControl.Area')}: ${numFormat(
                hectares
            )} ${locale('MeasureControl.Hectares')} (${numFormat(
                acres
            )} ${locale('MeasureControl.Acres')})`

            createElement({
                element: 'div',
                className: 'dhis2-map-ctrl-measure-area',
                text: areaText,
                appendTo: this._distanceText,
            })
        }

        mapgl.getSource('measure').setData(geojson)
    }

    _onMouseMove = evt => {
        const mapgl = this._map.getMapGL()

        const features = mapgl.queryRenderedFeatures(evt.point, {
            layers: ['measure-points'],
        })

        // UI indicator for clicking/hovering a point on the map
        mapgl.getCanvas().style.cursor = features.length
            ? 'pointer'
            : 'crosshair'
    }

    _onLayerSort = () => {
        const mapgl = this._map.getMapGL()
        const layers = ['measure-points', 'measure-line', 'measure-polygon']

        layers.forEach(layer => {
            if (mapgl.getLayer(layer)) {
                mapgl.moveLayer(layer)
            }
        })
    }
}

export default MeasureControl
