import { Map, AttributionControl, Popup } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Evented } from 'mapbox-gl'
import Layer from './layers/Layer'
import layerTypes from './layers/layerTypes'
import controlTypes from './controls/controlTypes'
import { getBoundsFromLayers } from './utils/geometry'
import syncMaps from './utils/sync'
import './Map.css'

const defaultLocale = {
    'SearchControl.SearchForPlace': 'Search for place or address',
    'FitBoundsControl.ZoomToContent': 'Zoom to content',
    'MeasureControl.MeasureDistancesAndAreas': 'Measure distances and areas',
}

export class MapGL extends Evented {
    // Returns true if the layer type is supported
    static hasLayerSupport(type) {
        return !!layerTypes[type]
    }

    // Returns true if the control type is supported
    static hasControlSupport(type) {
        return !!controlTypes[type]
    }

    constructor(el, options) {
        super()

        const { locale, ...opts } = options

        this._mapgl = new Map({
            container: el,
            style: {
                version: 8,
                sources: {},
                layers: [],
                glyphs: 'http://fonts.openmaptiles.org/{fontstack}/{range}.pbf', // TODO: Host ourseleves
            },
            maxZoom: 18,
            attributionControl: false,
            locale: {
                ...defaultLocale,
                ...locale,
            },
            ...opts,
        })

        this._attributionControl = new AttributionControl()
        this._mapgl.addControl(this._attributionControl)

        this._mapgl.on('load', evt => this.fire('ready', this))
        this._mapgl.on('click', evt => this.onClick(evt))
        this._mapgl.on('contextmenu', evt => this.onContextMenu(evt))

        // TODO: Don't add before we have any vector layers
        this._mapgl.on('mousemove', evt => this.onMouseMove(evt))

        this._layers = []
        this._controls = {}
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

            // Layer is removed while being created
            if (!this.hasLayer(layer)) {
                this.removeLayer(layer)
            }
        }

        this.orderLayers()
    }

    removeLayer(layer) {
        if (layer.isOnMap()) {
            layer.removeFrom(this)
        }

        this._layers = this._layers.filter(l => l !== layer)
    }

    remove() {
        // console.log("remove map");
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
        // console.log('removeControl', control)
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

    onClick(evt) {
        const eventObj = this._createClickEvent(evt)
        const { feature } = eventObj

        if (feature) {
            const layer = this.getLayerFromId(feature.layer.id)

            if (layer) {
                layer.onClick(eventObj)
            }
        }
    }

    onContextMenu(evt) {
        const eventObj = this._createClickEvent(evt)

        if (eventObj.feature) {
            const layer = this.getLayerFromId(eventObj.feature.layer.id)
            layer.fire('contextmenu', eventObj)
        } else {
            this.fire('contextmenu', eventObj)
        }
    }

    onMouseMove(evt) {
        const feature = this.getEventFeature(evt)
        let featureId
        let sourceId
        let featureSourceId

        if (feature) {
            featureId = feature.id
            sourceId = feature.source
            featureSourceId = `${featureId}-${sourceId}`
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
        if (this._controls[type]) {
            return this._controls[type]._container
        }

        return document.createElement('div') // TODO
    }

    orderLayers() {
        const outOfOrder = this._layers.some(
            (layer, index) => layer.getIndex() !== index
        )

        if (outOfOrder) {
            this._layers.sort((a, b) => a.getIndex() - b.getIndex())

            for (let i = 1; i < this._layers.length; i++) {
                const layer = this._layers[i]

                if (layer.isOnMap()) {
                    layer.moveToTop()
                }
            }
        }
    }

    openPopup(content, lnglat, onClose) {
        this._popup = new Popup({
            maxWidth: 'auto',
        })
            .setLngLat(lnglat)
            .setDOMContent(content)
            .addTo(this._mapgl)

        if (typeof onClose === 'function') {
            this._popup.once('close', onClose)
        }
    }

    closePopup() {
        if (this._popup) {
            this._popup.remove()
            this._popup = null
        }
    }

    // Only called within the API
    _updateAttributions() {
        this._attributionControl._updateAttributions()
    }

    _createClickEvent(evt) {
        const { lngLat, originalEvent } = evt
        const type = 'click'
        const coordinates = [lngLat.lng, lngLat.lat]
        const position = [
            originalEvent.x,
            originalEvent.pageY || originalEvent.y,
        ]
        const feature = this.getEventFeature(evt)

        return { type, coordinates, position, feature }
    }
}

export default MapGL
