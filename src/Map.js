import { Map } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Evented } from 'mapbox-gl'
import Layer from './layers/Layer'
import layerTypes from './layers/layerTypes'
import controlTypes from './controls/controlTypes'
import controlsLocale from './controls/controlsLocale'
import { transformRequest } from './utils/images'
import { getBoundsFromLayers } from './utils/geometry'
import syncMaps from './utils/sync'
import Popup from './ui/Popup'
import Label from './ui/Label'
import './Map.css'

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
            style: {
                version: 8,
                sources: {},
                layers: [],
                glyphs:
                    'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf', // TODO: Host ourseleves
            },
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
                padding: 20,
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

        this.orderLayers()
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
        let featureId
        let sourceId
        let featureSourceId

        if (feature) {
            featureId = feature.id
            sourceId = feature.source
            featureSourceId = `${featureId}-${sourceId}`

            const layer = this.getLayerFromId(feature.layer.id)

            console.log('onMouseMove #####', featureSourceId, layer, feature);

            if (layer) {
                layer.onMouseMove(evt, feature)
            }
        } else {
            this.hideLabel()
        }

        if (featureSourceId !== this._hoverId) {
            const mapgl = this.getMapGL()

            mapgl.getCanvas().style.cursor = feature ? 'pointer' : ''

            if (this._hoverState) {
                if (mapgl.getSource(this._hoverState.source)) {
                    mapgl.setFeatureState(this._hoverState, { hover: false })
                }
                this._hoverState = null
            }

            if (feature) {
                this._hoverState = {
                    source: sourceId,
                    id: featureId,
                }

                mapgl.setFeatureState(this._hoverState, { hover: true })
            }
        }

        this._hoverId = featureSourceId
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

    orderLayers() {
        this._layers.sort((a, b) => a.getIndex() - b.getIndex())

        for (let i = 1; i < this._layers.length; i++) {
            const layer = this._layers[i]

            if (layer.isOnMap()) {
                layer.moveToTop()
            }
        }

        this.fire('layersort')
    }

    openPopup(content, lnglat, onClose) {
        if (!this._popup) {
            this._popup = new Popup()
        }

        this._popup
            .setLngLat(lnglat)
            .setDOMContent(content)
            .onClose(onClose)
            .addTo(this)
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
