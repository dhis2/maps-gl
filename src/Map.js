import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import EventEmitter from 'events'
import getControl from './controls'
import Layer from './layers/Layer'
import TileLayer from './layers/TileLayer'
import Choropleth from './layers/Choropleth'
import Boundary from './layers/Boundary'
import Markers from './layers/Markers'
import Dots from './layers/Dots'
import ClientCluster from './layers/ClientCluster'
import EarthEngine from './layers/EarthEngine'

const layers = {
    tileLayer: TileLayer,
    choropleth: Choropleth,
    boundary: Boundary,
    markers: Markers,
    dots: Dots,
    clientCluster: ClientCluster,
    earthEngine: EarthEngine,
}

export class Map extends EventEmitter {
    /*
  static boundsOptions = {
    padding: 20,
  };
  */

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
            layer.addTo(this)
        }
        this._layers.push(layer)
        this._isReady = true

        // TODO: Small delay added as TileLayer is not added immediately
        setTimeout(() => this.orderLayers(), 50)
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
        const feature = this.getEventFeature(evt)
        if (feature) {
            const { type, lngLat } = evt
            const layer = this.getLayerFromId(feature.layer.id)
            const coordinates = [lngLat.lng, lngLat.lat]

            // "Normalise" event
            layer.emit('click', {
                type,
                coordinates,
                feature: {
                    type: 'Feature',
                    properties: feature.properties,
                    geometry: feature.geometry,
                },
            })
        }
    }

    onContextMenu(evt) {
        const feature = this.getEventFeature(evt)
        if (feature) {
            const layer = this.getLayerFromId(feature.layer.id)
            layer.emit('contextmenu', {
                layer: { feature },
                latlng: evt.lngLat,
                originalEvent: evt.originalEvent,
            })
        } else {
            this.emit('contextmenu', {
                latlng: evt.lngLat,
                originalEvent: evt.originalEvent,
            })
        }
    }

    onMouseMove(evt) {
        const feature = this.getEventFeature(evt)
        let featureId
        let layerId
        let featureLayerId

        if (feature) {
            featureId = feature.id
            layerId = feature.layer.id
            featureLayerId = `${featureId}-${layerId}`
        }

        if (featureLayerId !== this._hoverId) {
            const mapgl = this.getMapGL()

            mapgl.getCanvas().style.cursor = feature ? 'pointer' : ''

            if (this._hoverState) {
                mapgl.setFeatureState(this._hoverState, { hover: false })
                this._hoverState = null
            }

            if (feature) {
                this._hoverState = {
                    source: layerId,
                    id: featureId,
                }

                mapgl.setFeatureState(this._hoverState, { hover: true })
            }
        }

        this._hoverId = featureLayerId
    }

    // TODO: throttle?
    getEventFeature(evt) {
        const layers = this.getLayers()
            .filter(l => l.isInteractive())
            .map(l => l.getInteractiveId())
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

    orderLayers() {
        const outOfOrder = this._layers.some(
            (layer, index) => layer.getIndex() !== index
        )

        if (outOfOrder) {
            this._layers.sort((a, b) => a.getIndex() - b.getIndex())

            for (let i = 1; i < this._layers.length; i++) {
                this._layers[i].moveToTop()
            }
        }
    }

    openPopup(content, coordinates) {
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(content)
            .addTo(this._mapgl)
    }
}

export default Map
