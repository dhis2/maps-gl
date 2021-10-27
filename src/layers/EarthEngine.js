import PromiseWorker from 'promise-worker'
import Layer from './Layer'
import {
    getInfo,
    getScale,
    hasClasses,
    combineReducers,
    getParamsFromLegend,
    getHistogramStatistics,
    getFeatureCollectionProperties,
} from '../earthengine/ee_utils'
import { isPoint, featureCollection } from '../utils/geometry'
import { getBufferGeometry } from '../utils/buffers'
import { polygonLayer, outlineLayer, pointLayer } from '../utils/layers'
import { setPrecision } from '../utils/numbers'
import * as types from '../earthengine/ee_worker_message_types'

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
    }

    // EE initialise
    async init() {
        this.createWorker()
        await this.setAuthToken()
    }

    createWorker() {
        this.worker = new PromiseWorker(
            new Worker(new URL('../earthengine/ee_worker.js', import.meta.url))
        )
    }

    async setFeatureCollection() {
        const features = this.getFeatures()

        if (features.length) {
            await this.worker.postMessage({
                type: types.FEATURE_COLLECTION_SET,
                payload: features,
            })
        }
    }

    async createSource() {
        const id = this.getId()

        const {
            datasetId,
            filter,
            mosaic,
            band,
            bandReducer,
            mask,
            methods,
            legend,
            params,
        } = this.options

        const urlFormat = await this.worker.postMessage({
            type: types.IMAGE_CREATE,
            payload: {
                datasetId,
                filter,
                mosaic,
                band,
                bandReducer,
                mask,
                methods,
                legend,
                params,
            },
        })

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

            return this.worker.postMessage({
                type: types.AUTH_TOKEN_SET,
                payload: {
                    ...token,
                    tokenType,
                },
            })
        }
    }

    // Get OAuth2 token needed to create and load Google Earth Engine layers
    getAuthToken() {
        return new Promise((resolve, reject) => {
            const { accessToken } = this.options

            if (accessToken) {
                if (accessToken instanceof Function) {
                    // Callback function returning auth obect
                    accessToken(resolve)
                } else {
                    // Auth token as object
                    resolve(accessToken)
                }
            }

            reject(new Error('No access token in layer options.'))
        })
    }

    // Refresh OAuth2 token when expired
    refreshAccessToken = async (authArgs, callback) => {
        const { tokenType } = this.options
        const token = await this.getAuthToken()

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

    // Create EE tile layer from params
    async createImage() {
        const { datasetId } = this.options

        // Apply filter (e.g. period)
        let eeImage = await this.applyFilter(datasetId)

        // Select band (e.g. age group)
        eeImage = this.selectBand(eeImage)

        // Mask out 0-values
        eeImage = this.maskImage(eeImage)

        // Run methods on image
        eeImage = this.runMethods(eeImage)

        this.eeImage = eeImage

        // Image is ready for aggregations
        this.fire('imageready', { type: 'imageready', image: eeImage })

        // Classify image
        return this.classifyImage(eeImage)
    }

    // Apply array of filters returns image
    applyFilter = async datasetId => {
        const { filter, mosaic } = this.options
        const { Filter, Image, ImageCollection } = this.ee

        if (!filter) {
            const image = Image(datasetId)
            this.scale = await getScale(image)
            return image
        }

        let collection = ImageCollection(datasetId)

        // Scale is lost when creating a mosaic below
        // https://developers.google.com/earth-engine/guides/projections
        this.scale = await getScale(collection.first())

        filter.forEach(f => {
            collection = collection.filter(
                Filter[f.type].apply(this, f.arguments)
            )
        })

        if (mosaic) {
            // Composite all images inn a collection (e.g. per country)
            return collection.mosaic()
        }

        // There should only be one image after applying the filters
        return Image(collection.first())
    }

    // Select band(s)
    selectBand(eeImage) {
        const { band, bandReducer } = this.options
        const { Reducer } = this.ee

        if (band) {
            eeImage = eeImage.select(band)

            if (Array.isArray(band) && bandReducer && Reducer[bandReducer]) {
                // Combine multiple bands (e.g. age groups)
                eeImage = eeImage.reduce(Reducer[bandReducer]())
            }
        }

        return eeImage
    }

    // Run methods on image
    runMethods(eeImage) {
        const { methods } = this.options

        if (methods) {
            Object.keys(methods).forEach(method => {
                if (eeImage[method]) {
                    eeImage = eeImage[method].apply(eeImage, methods[method])
                }
            })
        }

        return eeImage
    }

    // Mask out 0-values
    maskImage(eeImage) {
        return this.options.mask ? eeImage.updateMask(eeImage.gt(0)) : eeImage
    }

    // Classify image according to legend
    classifyImage(eeImage) {
        const { legend = [], params } = this.options
        let zones

        if (!params) {
            // Image has classes (e.g. landcover)
            this.params = getParamsFromLegend(legend)
            return eeImage
        }

        const min = 0
        const max = legend.length - 1
        const { palette } = params

        for (let i = min, item; i < max; i++) {
            item = legend[i]

            if (!zones) {
                zones = eeImage.gt(item.to)
            } else {
                zones = zones.add(eeImage.gt(item.to))
            }
        }

        // Visualisation params
        this.params = { min, max, palette }

        return zones
    }

    // Visualize image (turn into RGB)
    visualize = () =>
        this._visualize ||
        new Promise(resolve => {
            const { params } = this.options

            this.featureCollection = this.getFeatureCollection()

            this.createImage().then(eeImage => {
                // Clip image to org unit features
                if (this.featureCollection) {
                    eeImage = eeImage.clipToCollection(this.featureCollection)
                }

                eeImage
                    .visualize(this.params || params)
                    .getMap(null, response => {
                        this._visualize = response
                        resolve(response)
                    })
            })
        })

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
        const { legend } = this.options
        const classes = hasClasses(aggregationType)
        const image = await this.getImage()
        const collection = this.featureCollection
        const scale = this.scale
        const { Reducer } = this.ee

        if (classes && legend) {
            // Used for landcover
            const reducer = Reducer.frequencyHistogram()

            return getInfo(
                image
                    .reduceRegions(collection, reducer, scale)
                    .select(['histogram'], null, false)
            ).then(data =>
                getHistogramStatistics({
                    data,
                    scale,
                    aggregationType,
                    legend,
                })
            )
        } else if (Array.isArray(aggregationType) && aggregationType.length) {
            const reducer = combineReducers(ee)(aggregationType)

            const aggFeatures = image
                .reduceRegions({
                    collection,
                    reducer,
                    scale,
                })
                .select(aggregationType, null, false)

            return getInfo(aggFeatures).then(getFeatureCollectionProperties)
        }
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
