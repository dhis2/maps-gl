import Layer from './Layer'
import { defaultOptions, getWorkerOptions } from '../earthengine/ee_utils'
import getEarthEngineWorker from '../earthengine/ee_worker_loader'
import { isPoint, featureCollection } from '../utils/geometry'
import { getBufferGeometry } from '../utils/buffers'
import { polygonLayer, outlineLayer, pointLayer } from '../utils/layers'
import { setPrecision } from '../utils/numbers'

class EarthEngine extends Layer {
    constructor(options) {
        super({
            ...defaultOptions,
            ...options,
        })
    }

    async addTo(map) {
        this._map = map

        if (map.styleIsLoaded()) {
            return this.getWorkerInstance().then(async worker => {
                this.worker = worker
                const tileUrl = await worker.getTileUrl()

                // Don't continue if layer is terminated (deleted or edited)
                if (!this._terminated) {
                    this.createSource(tileUrl)
                    this.createLayers()
                    super.addTo(map)
                    this.onLoad()

                    if (this.options.preload) {
                        this.getAggregations()
                    }
                }
            })
        }
    }

    removeFrom(map) {
        this._terminated = true
        super.removeFrom(map)
    }

    getWorkerInstance = () =>
        new Promise((resolve, reject) =>
            getEarthEngineWorker(this.options.getAuthToken)
                .then(EarthEngineWorker => {
                    new EarthEngineWorker(getWorkerOptions(this.options)).then(
                        resolve
                    )
                })
                .catch(reject)
        )

    createSource(tileUrl) {
        const id = this.getId()

        this.setSource(`${id}-raster`, {
            type: 'raster',
            tileSize: 256,
            tiles: [tileUrl],
        })

        if (this.options.data) {
            this.setSource(id, {
                type: 'geojson',
                data: featureCollection(this.getFeatures()),
            })
        }
    }

    createLayers() {
        const id = this.getId()
        const source = id

        this.addLayer({
            id: `${id}-raster`,
            type: 'raster',
            source: `${id}-raster`,
        })

        if (this.options.data) {
            this.addLayer(polygonLayer({ id, source, opacity: 0.9 }), true)
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
        this.setSource(`${this.getId()}-points`, {
            type: 'geojson',
            data: featureCollection(data.filter(isPoint)),
        })

        super.setFeatures(data.map(this.createBuffer.bind(this)))
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
            const options = {
                ...this.options,
                value: typeof value === 'number' ? setPrecision(value) : value,
            }
            const content = options.popup.replace(
                /\{ *([\w_-]+) *\}/g,
                (str, key) => options[key]
            )

            this._map.openPopup(document.createTextNode(content), [lng, lat])
        })

    getAggregations = () => {
        if (!this._aggregationsPromise) {
            this._aggregationsPromise = this.worker.getAggregations()
        }
        return this._aggregationsPromise
    }

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
    getFilteredFeatures(ids) {
        const features = this.getFeatures()

        return Array.isArray(ids)
            ? features.filter(f => ids.includes(f.properties.id))
            : features
    }

    // Filter the org units features shown
    filter(ids) {
        const source = this.getMapGL().getSource(this.getId())

        if (source) {
            source.setData(featureCollection(this.getFilteredFeatures(ids)))
        }
    }
}

export default EarthEngine
