import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Evented } from 'mapbox-gl'
import getControl from './controls'
import Layer from './layers/Layer'
import TileLayer from './layers/TileLayer'
import Choropleth from './layers/Choropleth'
import Boundary from './layers/Boundary'
import Markers from './layers/Markers'
import Dots from './layers/Dots'
import ClientCluster from './layers/ClientCluster'
import EarthEngine from './layers/EarthEngine'
import { getBoundsFromLayers } from './utils/geometry'

const layers = {
    tileLayer: TileLayer,
    wmsLayer: TileLayer,
    choropleth: Choropleth,
    boundary: Boundary,
    markers: Markers,
    dots: Dots,
    clientCluster: ClientCluster,
    earthEngine: EarthEngine,
}

export class Map extends Evented {
    constructor(el) {
        super()

        this._mapgl = new mapboxgl.Map({
            container: el,
            style: {
                version: 8,
                sources: {},
                layers: [],
                glyphs: 'http://fonts.openmaptiles.org/{fontstack}/{range}.pbf', // TODO: Host ourseleves
            },
            maxZoom: 18,
        })

        this._mapgl.on('click', evt => this.onClick(evt))
        this._mapgl.on('contextmenu', evt => this.onContextMenu(evt))

        // TODO: Don't add before we have any vector layers
        this._mapgl.on('mousemove', evt => this.onMouseMove(evt))

        this._layers = []
        this._isReady = false
    }

    fitBounds(bounds) {
        if (bounds) {
            // TODO: Avoid timeout
            setTimeout(() => {
                this._mapgl.fitBounds(bounds, {
                    padding: 20,
                })
            }, 200)
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

    async addLayerWhenReady(layer) {
        if (!layer.isOnMap()) {
            await layer.addTo(this)
        }
        this._layers.push(layer)
        this._isReady = true

        this.orderLayers()
    }

    addLayer(layer) {
        if (!layer.isOnMap()) {
            if (this.isMapReady()) {
                this.addLayerWhenReady(layer)
            } else {
                this._mapgl.once('styledata', () =>
                    this.addLayerWhenReady(layer)
                )
            }
        }
    }

    removeLayer(layer) {
        layer.removeFrom(this)
        this._layers = this._layers.filter(l => l !== layer)
    }

    remove() {
        // console.log("remove map");
    }

    isMapReady() {
        return this._isReady || this._mapgl.isStyleLoaded()
    }

    hasLayer(layer) {
        return layer && layer.isOnMap()
    }

    // Returns true if the layer type is supported
    hasLayerSupport(type) {
        return !!layers[type]
    }

    addControl(control) {
        const mapboxControl = getControl(control)

        if (mapboxControl) {
            this._mapgl.addControl(mapboxControl)
        }
    }

    removeControl(control) {
        console.log('removeControl', control)
    }

    createLayer(config) {
        if (layers[config.type]) {
            return new layers[config.type](config)
        } else {
            console.log('Unknown layer type', config.type)
            return new Layer()
        }
    }

    openPopup(popup) {
        console.log('openPopup', popup)
    }

    resize() {
        this._mapgl.resize()
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

    orderLayers() {
        const outOfOrder = this._layers.some(
            (layer, index) => layer.getIndex() !== index
        )

        if (outOfOrder) {
            this._layers.sort((a, b) => a.getIndex() - b.getIndex())

            for (let i = 1; i < this._layers.length; i++) {
                // console.log('moveToTop', this._layers[i])
                this._layers[i].moveToTop()
            }

            // console.log('style', this._mapgl.getStyle().layers);

            /*
            setTimeout(() => {
                console.log('style II', this._mapgl.getStyle().layers);
            }, 500)
            */
        }
    }

    openPopup(content, coordinates) {
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(content)
            .addTo(this._mapgl)
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

export default Map
