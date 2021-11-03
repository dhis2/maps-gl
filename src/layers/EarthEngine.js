import { proxy } from 'comlink'
import Layer from './Layer'
import { getInfo, getWorkerOptions } from '../earthengine/ee_utils'
import getEarthEngineWorker from '../earthengine/ee_worker_loader'
import { isPoint, featureCollection } from '../utils/geometry'
import { getBufferGeometry } from '../utils/buffers'
import { polygonLayer, outlineLayer, pointLayer } from '../utils/layers'
import { setPrecision } from '../utils/numbers'

export const defaultOptions = {
    tokenType: 'Bearer',
    bandReducer: 'sum',
    popup: '{name}: {value} {unit}',
}

class EarthEngine extends Layer {
    constructor(options) {
        super({
            ...defaultOptions,
            ...options,
        })
    }

    async addTo(map) {
        await this.init()
        await this.setFeatureCollection()
        await this.createSource()
        this.createLayers()
        super.addTo(map)
        this.onLoad()

        const test = await this.worker.getAggregations('eIQbndfxQMb')
        console.log('test', test)
    }

    // EE initialise
    async init() {
        await this.createWorkerInstance()
        await this.worker.initialize()
        await this.worker.setOptions(getWorkerOptions(this.options))
    }

    async createWorkerInstance() {
        if (!this.worker) {
            const EarthEngineWorker = getEarthEngineWorker()
            this.worker = await new EarthEngineWorker()
        }
    }

    async setFeatureCollection() {
        const features = this.getFeatures()

        if (features.length) {
            await this.worker.setFeatureCollection(features)
        }
    }

    async createSource() {
        const id = this.getId()
        const urlFormat = await this.worker.getTileUrl()

        this.setSource(`${id}-raster`, {
            type: 'raster',
            tileSize: 256,
            tiles: [urlFormat],
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

    setAuthToken = async () => {
        const { accessToken, tokenType } = this.options

        if (accessToken) {
            const token = await accessToken

            await this.worker.setAuthToken(
                {
                    ...token,
                    tokenType,
                },
                proxy(this.refreshAuthToken)
            )
        }
    }

    // Refresh OAuth2 token when expired (called from worker)
    refreshAuthToken = async (authArgs, callback) => {
        const { tokenType } = this.options
        const token = await accessToken

        callback({
            token_type: tokenType,
            access_token: token.access_token,
            state: authArgs.scope,
            expires_in: token.expires_in,
        })
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

    // Create feature collection for org unit aggregations
    getFeatureCollection() {
        const { FeatureCollection } = this.ee
        const features = this.getFeatures()

        return features.length
            ? FeatureCollection(
                  features.map(f => ({
                      ...f,
                      id: f.properties.id, // EE requires id to be string, MapLibre integer
                  }))
              )
            : null
    }

    // Returns value at at position
    getValue = latlng => {
        const { band, legend } = this.options
        const { Geometry, Reducer } = this.ee
        const { lng, lat } = latlng
        const point = Geometry.Point(lng, lat)

        return getInfo(
            this.eeImage.reduceRegion(Reducer.mean(), point, 1)
        ).then(data => {
            const value = data[band] || Object.values(data)[0]

            // Used for landcover
            const item =
                Array.isArray(legend) && legend.find(i => i.id === value)

            return item ? item.name : value
        })
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

    // Returns ee image when ready
    getImage = () =>
        new Promise(resolve =>
            this.eeImage
                ? resolve(this.eeImage)
                : this.once('imageready', evt => resolve(evt.image))
        )

    // Perform aggregations to org unit features
    aggregate = async aggregationType => {
        return {}
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
