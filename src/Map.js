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
import { getFeaturesString } from './utils/core'
import { OVERLAY_START_POSITION } from './utils/layers'
import Popup from './ui/Popup'
import Label from './ui/Label'
import './Map.css'

const renderedClass = 'dhis2-map-rendered'

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

        const { locale, glyphs, ...opts } = options

        const mapgl = new Map({
            container: el,
            style: mapStyle({ glyphs }),
            maxZoom: 18,
            preserveDrawingBuffer: true, // TODO: requred for map download, but reduced performance
            attributionControl: false,
            locale: controlsLocale,
            transformRequest,
            ...opts,
        })

        this._mapgl = mapgl
        this._glyphs = glyphs

        // Translate strings
        if (locale) {
            Object.keys(mapgl._locale).forEach(id => {
                const str = mapgl._locale[id]
                if (locale[str]) {
                    mapgl._locale[id] = locale[str]
                }
            })
        }

        mapgl.on('render', this.onRender)
        mapgl.on('idle', this.onIdle)
        mapgl.on('load', this.onLoad)
        mapgl.on('click', this.onClick)
        mapgl.on('contextmenu', this.onContextMenu)
        mapgl.on('mousemove', this.onMouseMove)
        mapgl.on('mouseout', this.onMouseOut)
        mapgl.on('error', this.onError)

        this._layers = []
        this._controls = {}

        if (options.attributionControl !== false) {
            this.addControl({ type: 'attribution' })
        }
    }

    fitBounds(bounds, fitBoundsOptions) {
        if (bounds) {
            this._mapgl.fitBounds(
                bounds,
                fitBoundsOptions || {
                    padding: 10,
                    duration: 0,
                }
            )
        }
    }

    fitWorld() {
        this.fitBounds([
            [-180, -90],
            [180, 90],
        ])
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

    async removeLayer(layer) {
        this._layers = this._layers.filter(l => l !== layer)

        await layer.removeFrom(this)

        this.fire('layerremove', this._layers)
    }

    // Reorder overlays on the map
    orderOverlays() {
        const layers = this.getLayers()
        const beforeId = this.getBeforeLayerId()

        for (let i = OVERLAY_START_POSITION; i < layers.length; i++) {
            const layer = layers[i]

            if (layer.isOnMap()) {
                layer.move(beforeId)
            }
        }

        this.fire('layersort')
    }

    remove() {
        const mapgl = this._mapgl

        mapgl.off('render', this.onRender)
        mapgl.off('idle', this.onIdle)
        mapgl.off('load', this.onLoad)
        mapgl.off('click', this.onClick)
        mapgl.off('contextmenu', this.onContextMenu)
        mapgl.off('mousemove', this.onMouseMove)
        mapgl.off('mouseout', this.onMouseOut)
        mapgl.off('error', this.onError)

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
        let layer

        if (feature) {
            layer = this.getLayerFromId(feature.layer.id)

            if (layer) {
                layer.onMouseMove(evt, feature)
            }
        } else {
            this.hideLabel()
        }

        this.setHoverState(
            layer && feature?.properties?.id
                ? layer.getFeaturesById(feature.properties.id)
                : null
        )

        this.getMapGL().getCanvas().style.cursor = feature ? 'pointer' : ''
    }

    // Remove rendered class if rendering is happening
    onRender = () => {
        this._removeClass(renderedClass)

        if (this._renderTimeout) {
            clearTimeout(this._renderTimeout)
            this._renderTimeout = null
        }
    }

    // Add rendered class if map is idle
    onIdle = () => {
        // Return if some layers are still loading data
        if (this.getLayers().some(layer => layer._isLoading)) {
            return
        }

        // Make sure the map stay rendered for at least 500ms
        this._renderTimeout = setTimeout(() => {
            this._addClass(renderedClass)
            this._renderTimeout = null
        }, 500)
    }

    // Set hover state for features
    setHoverState(features) {
        // Only set hover state when features are changed
        if (
            getFeaturesString(features) !==
            getFeaturesString(this._hoverFeatures)
        ) {
            if (this._hoverFeatures) {
                // Clear state for existing hover features
                this._hoverFeatures.forEach(feature =>
                    this.setFeatureState(feature, { hover: false })
                )
                this._hoverFeatures = null
            }

            if (Array.isArray(features)) {
                this._hoverFeatures = features
                features.forEach(feature =>
                    this.setFeatureState(feature, { hover: true })
                )
            }
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

    onError = evt => {
        // TODO: Use optional chaining when DHIS2 Maps 2.35 is not supported
        if (evt && evt.error && evt.error.message && console && console.error) {
            const { message } = evt.error
            console.error(
                message === 'Failed to fetch'
                    ? 'Failed to fetch map data, are you offline?'
                    : message
            )
        }
    }

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
        this._layers.sort((a, b) => a.getIndex() - b.getIndex())
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

    // Set before layer id for vector style basemap for labels on top
    setBeforeLayerId(beforeId) {
        this._beforeId = beforeId
    }

    // Returns before layer id if exists among layers
    getBeforeLayerId() {
        return this._beforeId &&
            this.getMapGL()
                .getStyle()
                .layers.find(layer => layer.id === this._beforeId)
            ? this._beforeId
            : undefined
    }

    styleIsLoaded() {
        return !this._styleIsLoading
    }

    openPopup(content, lnglat, onClose) {
        if (!this._popup) {
            this._popup = new Popup()
        }

        // Remove previous attached onClose event before setting new content
        this._popup.clear()

        this._popup.setLngLat(lnglat).setDOMContent(content).addTo(this)

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

    // Add class to map container
    _addClass(className) {
        const { classList } = this.getContainer()

        if (!classList.contains(className)) {
            classList.add(className)
        }
    }

    // Remove class from map container
    _removeClass(className) {
        const { classList } = this.getContainer()

        if (classList.contains(className)) {
            classList.remove(className)
        }
    }
}

export default MapGL
