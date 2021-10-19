import { Evented, Map } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Layer from './layers/Layer'
import layerTypes from './layers/layerTypes'
import controlTypes from './controls/controlTypes'
import controlsLocale from './controls/controlsLocale'
import MultiTouch from './controls/MultiTouch'
import { transformRequest } from './utils/images'
import { mapStyle } from './utils/style'
import { getBoundsFromLayers } from './utils/geometry'
import syncMaps from './utils/sync'
import Popup from './ui/Popup'
import Label from './ui/Label'
import './Map.css'

// const BASEMAP_POSITION = 0
// position in the layer stack where deepest overlay is found
const DEEPEST_OVERLAY_POSITION = 1

export class MapGL extends Evented {
    // Returns true if the layer type is supported
    static hasLayerSupport(type) {
        return !!layerTypes[type]
    }

    // Returns true if the control type is supported
    static hasControlSupport(type) {
        return !!controlTypes[type]
    }

    constructor(el, options = {}) {
        super()

        const { locale, ...opts } = options

        const mapgl = new Map({
            container: el,
            style: mapStyle,
            maxZoom: 18,
            preserveDrawingBuffer: true, // TODO: requred for map download, but reduced performance
            attributionControl: false,
            locale: controlsLocale,
            transformRequest,
            ...opts,
        })

        this._mapgl = mapgl

        // Translate strings
        if (locale) {
            Object.keys(mapgl._locale).forEach(id => {
                const str = mapgl._locale[id]
                if (locale[str]) {
                    mapgl._locale[id] = locale[str]
                }
            })
        }

        mapgl.on('load', this.onLoad)
        mapgl.on('click', this.onClick)
        mapgl.on('contextmenu', this.onContextMenu)
        mapgl.on('mousemove', this.onMouseMove)
        mapgl.on('mouseout', this.onMouseOut)

        this._layers = []
        this._controls = {}

        if (options.attributionControl !== false) {
            this.addControl({ type: 'attribution' })
        }
    }

    fitBounds(bounds) {
        if (bounds) {
            this._mapgl.fitBounds(bounds, {
                padding: 10,
                duration: 0,
            })
        }
    }

    fitWorld() {
        this.fitBounds([[-180, -90], [180, 90]])
    }

    setView(lnglat, zoom) {
        this._mapgl.setCenter(lnglat)
        this._mapgl.setZoom(zoom)
    }

    getContainer() {
        return this._mapgl.getContainer()
    }

    getMapGL() {
        return this._mapgl
    }

    async addLayer(layer) {
        this._layers.push(layer)

        if (!layer.isOnMap()) {
            await layer.addTo(this)

            this.fire('layeradd', this._layers)

            // Layer is removed while being created
            if (!this.hasLayer(layer)) {
                this.removeLayer(layer)
            }
        }

        this.orderOverlays()
    }

    orderOverlays() {
        this.sortLayers()

        for (let i = DEEPEST_OVERLAY_POSITION; i < this._layers.length; i++) {
            const layer = this._layers[i]

            if (layer.isOnMap()) {
                layer.move(this._beforeId)
            }
        }

        this.fire('layersort')
    }

    async addOverlays() {
        for (let i = DEEPEST_OVERLAY_POSITION; i < this._layers.length; i++) {
            const layer = this._layers[i]
            if (!layer.isOnMap()) {
                await layer.addTo(this)
                layer.setVisibility(layer.isVisible())
                layer.addEventListeners()
            }
        }
    }

    sortLayers() {
        this._layers.sort((a, b) => a.getIndex() - b.getIndex())
    }

    removeOverlayEvents() {
        if (this._layers.length <= 1) {
            return
        }
        this.sortLayers()

        for (let i = DEEPEST_OVERLAY_POSITION; i < this._layers.length; i++) {
            const layer = this._layers[i]

            layer.removeEventListeners()
        }
    }

    removeLayer(layer) {
        if (this._mapgl && layer.isOnMap()) {
            layer.removeFrom(this)
        }

        this._layers = this._layers.filter(l => l !== layer)

        this.fire('layerremove', this._layers)
    }

    remove() {
        const mapgl = this._mapgl

        mapgl.off('load', this.onLoad)
        mapgl.off('click', this.onClick)
        mapgl.off('contextmenu', this.onContextMenu)
        mapgl.off('mousemove', this.onMouseMove)
        mapgl.off('mouseout', this.onMouseOut)

        mapgl.remove()

        this._mapgl = null
    }

    hasLayer(layer) {
        return !!this._layers.find(l => l === layer)
    }

    addControl(config) {
        const { type } = config

        if (controlTypes[type]) {
            const control = new controlTypes[type](config)

            if (control.addTo) {
                control.addTo(this)
            } else {
                this._mapgl.addControl(control)
            }

            this._controls[type] = control
        }
    }

    removeControl(control) {
        this._mapgl.removeControl(control)
    }

    createLayer(config) {
        if (layerTypes[config.type]) {
            return new layerTypes[config.type](config)
        } else {
            console.log('Unknown layer type', config.type)
            return new Layer()
        }
    }

    resize() {
        this._mapgl.resize()
    }

    // Synchronize this map with other maps with the same id
    sync(id) {
        syncMaps.add(id, this._mapgl)
    }

    // Remove synchronize of this map
    unsync(id) {
        syncMaps.remove(id, this._mapgl)
    }

    onLoad = () => {
        this.fire('ready', this)
    }

    onClick = evt => {
        const eventObj = this._createClickEvent(evt)
        const { feature } = eventObj

        if (feature) {
            const layer = this.getLayerFromId(feature.layer.id)

            if (layer) {
                layer.onClick(eventObj)
            }
        }

        this.fire('click', eventObj)
    }

    onContextMenu = evt => {
        const eventObj = this._createClickEvent(evt)

        if (eventObj.feature) {
            const layer = this.getLayerFromId(eventObj.feature.layer.id)
            layer.fire('contextmenu', eventObj)
        } else {
            this.fire('contextmenu', eventObj)
        }
    }

    onMouseMove = evt => {
        const feature = this.getEventFeature(evt)

        if (feature) {
            const layer = this.getLayerFromId(feature.layer.id)

            if (layer) {
                layer.onMouseMove(evt, feature)
            }
        } else {
            this.hideLabel()
        }

        this.setHoverState(feature)

        this.getMapGL().getCanvas().style.cursor = feature ? 'pointer' : ''
    }

    // Set hover state for source feature
    setHoverState(feature) {
        let featureSourceId

        if (feature) {
            const { id, source } = feature
            featureSourceId = `${id}-${source}`
        }

        // Only set hover state when feature is changed
        if (featureSourceId !== this._hoverId) {
            // Clear state for existing hover feature
            if (this._hoverState) {
                this.setFeatureState(this._hoverState, { hover: false })
                this._hoverState = null
            }

            // Set new feature hover state
            if (feature) {
                this._hoverState = feature
                this.setFeatureState(feature, { hover: true })
            }

            this._hoverId = featureSourceId
        }
    }

    // Helper function to set feature state for source
    setFeatureState(feature = {}, state = {}) {
        const mapgl = this.getMapGL()
        const { source } = feature

        if (source && mapgl.getSource(source)) {
            mapgl.setFeatureState(feature, state)
        }
    }

    onMouseOut = () => this.hideLabel()

    // Returns the map zoom level
    getZoom() {
        return this.getMapGL().getZoom()
    }

    // TODO: throttle?
    getEventFeature(evt) {
        const layers = this.getLayers()
            .filter(l => l.isInteractive())
            .map(l => l.getInteractiveIds())
            .reduce((out, ids) => [...out, ...ids], [])
        let feature

        if (layers.length) {
            feature = this._mapgl.queryRenderedFeatures(evt.point, {
                layers: layers,
            })[0] // [0] returns topmost
        }

        return feature
    }

    getLayerFromId(id) {
        return this._layers.find(layer => layer.hasLayerId(id))
    }

    getLayerAtIndex(index) {
        return this._layers[index]
    }

    getLayers() {
        return this._layers
    }

    // Returns combined bounds for all vector layers
    getLayersBounds() {
        return getBoundsFromLayers(this.getLayers())
    }

    // Returns the dom element of the control
    getControlContainer(type) {
        const control = this._controls[type]

        if (control) {
            return control._controlContainer || control._container
        }

        return document.createElement('div') // TODO
    }

    setBeforeLayerId(beforeId) {
        this._beforeId = beforeId
    }

    getBeforeLayerId() {
        return this._beforeId
    }

    beforeIdIsInMap() {
        return (
            this._beforeId &&
            this.getMapGL()
                .getStyle()
                .layers.find(layer => layer.id === this._beforeId)
        )
    }

    openPopup(content, lnglat, onClose) {
        if (!this._popup) {
            this._popup = new Popup()
        }

        // Remove previous attached onClose event before setting new content
        this._popup.clear()

        this._popup
            .setLngLat(lnglat)
            .setDOMContent(content)
            .addTo(this)

        // (Re)set onClose event
        this._popup.onClose(onClose)
    }

    closePopup() {
        if (this._popup) {
            this._popup.remove()
        }
    }

    showLabel(content, lnglat) {
        if (!this._label) {
            this._label = new Label()
        }

        this._label.setText(content).setLngLat(lnglat)

        if (!this._label.isOpen()) {
            this._label.addTo(this._mapgl)
        }
    }

    hideLabel() {
        if (this._label) {
            this._label.remove()
        }
    }

    toggleScrollZoom(isEnabled) {
        this.getMapGL().scrollZoom[isEnabled ? 'enable' : 'disable']()
    }

    // Added to allow dashboards to be scrolled on touch devices
    // Map can be panned with two fingers instead of one
    toggleMultiTouch(isEnabled) {
        const mapgl = this.getMapGL()

        if (!this._multiTouch) {
            this._multiTouch = new MultiTouch()
        }

        const hasControl = mapgl.hasControl(this._multiTouch)

        if (isEnabled && !hasControl) {
            mapgl.addControl(this._multiTouch)
        } else if (!isEnabled && hasControl) {
            mapgl.removeControl(this._multiTouch)
        }
    }

    // Only called within the API
    _updateAttributions() {
        if (this._controls.attribution) {
            this._controls.attribution._updateAttributions()
        }
    }

    _createClickEvent(evt) {
        const { lngLat } = evt
        const type = 'click'
        const coordinates = [lngLat.lng, lngLat.lat]
        const { x, y } = this.getMapGL().project(lngLat)
        const position = [x, y]
        const feature = this.getEventFeature(evt)

        return { type, coordinates, position, feature }
    }
}

export default MapGL
