import Layer from './Layer'
import getEarthEngineWorker from '../earthengine'
import { defaultOptions, getWorkerOptions } from '../utils/earthengine'
import { isPoint, featureCollection } from '../utils/geometry'
import { getBufferGeometry } from '../utils/buffers'
import { polygonLayer, outlineLayer, pointLayer } from '../utils/layers'
import { setPrecision } from '../utils/numbers'
import { setTemplate } from '../utils/core'

class EarthEngine extends Layer {
    constructor(options) {
        super({
            ...defaultOptions,
            ...options,
        })
    }

    addTo = map =>
        new Promise((resolve, reject) => {
            this._map = map

            if (map.styleIsLoaded()) {
                this.getWorkerInstance()
                    .then(async worker => {
                        this.worker = worker

                        if (!this._tileUrl) {
                            this._tileUrl = await worker.getTileUrl()
                        }

                        // Don't continue if layer is terminated (deleted or edited)
                        if (!this._terminated) {
                            this.createSource()
                            this.createLayers()
                            super.addTo(map)
                            this.onLoad()

                            const { preload, data } = this.options

                            // Get aggregations if not plugin (preload=false) and org units
                            // are passed (data not undefined)
                            if (preload && data) {
                                this.getAggregations()
                            }
                        }

                        resolve()
                    })
                    .catch(reject)
            } else {
                resolve()
            }
        })

    removeFrom(map, isStyleChange) {
        this._terminated = !isStyleChange
        super.removeFrom(map)
    }

    // Returns promise resolving a new worker instance
    getWorkerInstance = () => {
        if (!this._workerPromise) {
            this._workerPromise = new Promise((resolve, reject) =>
                getEarthEngineWorker(this.options.getAuthToken)
                    .then(EarthEngineWorker => {
                        new EarthEngineWorker(
                            getWorkerOptions(this.options)
                        ).then(resolve)
                    })
                    .catch(reject)
            )
        }
        return this._workerPromise
    }

    // Create layer source for raster tiles and org unit features
    createSource() {
        const id = this.getId()

        this.setSource(`${id}-raster`, {
            type: 'raster',
            tileSize: 256,
            tiles: [this._tileUrl],
        })

        if (this.options.data) {
            this.setSource(id, {
                type: 'geojson',
                data: featureCollection(this.getFilteredFeatures()),
            })
        }
    }

    // Create layers for raster tiles and org unit features
    createLayers() {
        const id = this.getId()
        const source = id
        const isInteractive = true

        this.addLayer({
            id: `${id}-raster`,
            type: 'raster',
            source: `${id}-raster`,
        })

        if (this.options.data) {
            this.addLayer(polygonLayer({ id, source, opacity: 0.9 }), {
                isInteractive,
            })
            this.addLayer(outlineLayer({ id, source }))
            this.addLayer(
                pointLayer({
                    id,
                    source: `${id}-points`,
                    radius: 4,
                    color: '#333',
                })
            )
        }
    }

    setFeatures(data = []) {
        // Set layer source for org unit point (facilities)
        this.setSource(`${this.getId()}-points`, {
            type: 'geojson',
            data: featureCollection(data.filter(isPoint)),
        })

        // Create buffer around org unit points
        if (this.options.buffer) {
            super.setFeatures(data.map(this.createBuffer.bind(this)))
        } else {
            console.log(
                'setFeatures',
                data,
                data.filter(feature => feature.geometry.type !== 'Point')
            )
            super.setFeatures(
                data.filter(feature => feature.geometry.type !== 'Point')
            )
        }
    }

    // Transform point feature to buffer polygon
    createBuffer(feature) {
        const { buffer } = this.options

        return buffer && feature.geometry.type === 'Point'
            ? {
                  ...feature,
                  geometry: getBufferGeometry(feature, buffer / 1000),
              }
            : feature
    }

    // Returns value at at position
    getValue = async lnglat => {
        const { band, legend } = this.options
        const data = await this.worker.getValue(lnglat)
        const value = data[band] || Object.values(data)[0]

        // Used for landcover
        const item = Array.isArray(legend) && legend.find(i => i.id === value)

        return item ? item.name : value
    }

    // TODO: Move popup handling to the maps app
    showValue = latlng =>
        this.getValue(latlng).then(value => {
            const { lng, lat } = latlng
            const options = this.options
            let content

            if (value === null) {
                content = setTemplate(options.nullPopup, options)
            } else {
                content = setTemplate(options.popup, {
                    ...options,
                    value:
                        typeof value === 'number' ? setPrecision(value) : value,
                })
            }

            this._map.openPopup(document.createTextNode(content), [lng, lat])
        })

    // Returns a promise that resolves to aggregation values
    getAggregations = () => {
        if (!this._aggregationsPromise) {
            this._aggregationsPromise = this.worker.getAggregations()
        }
        return this._aggregationsPromise
    }

    // Set the layer opacity
    setOpacity(opacity) {
        super.setOpacity(opacity)

        const id = this.getId()
        const layerId = `${id}-polygon`
        const mapgl = this.getMapGL()

        if (mapgl && mapgl.getLayer(layerId)) {
            // Clickable polygon layer should always be transparent
            mapgl.setPaintProperty(layerId, 'fill-opacity', 0)
        }
    }

    // Returns filtered features based on string ids
    getFilteredFeatures() {
        const features = this.getFeatures()
        const ids = this._filteredFeatureIds

        return Array.isArray(ids)
            ? features.filter(f => ids.includes(f.properties.id))
            : features
    }

    // Filter the org units features shown
    filter(ids) {
        this._filteredFeatureIds = ids

        const source = this.getMapGL().getSource(this.getId())

        if (source) {
            source.setData(featureCollection(this.getFilteredFeatures()))
        }
    }
}

export default EarthEngine
