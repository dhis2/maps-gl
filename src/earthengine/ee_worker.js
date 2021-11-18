import { expose } from 'comlink'
import ee from './ee_api_js_worker' // https://github.com/google/earthengine-api/pull/173
// import { ee } from '@google/earthengine/build/ee_api_js_debug' // Run "yarn add @google/earthengine"
import {
    getInfo,
    getScale,
    hasClasses,
    combineReducers,
    getParamsFromLegend,
    getHistogramStatistics,
    getFeatureCollectionProperties,
} from './ee_utils'
import { getBufferGeometry } from '../utils/buffers'

// Why we need to "hack" the '@google/earthengine bundle:
// https://groups.google.com/g/google-earth-engine-developers/c/nvlbqxrnzDk/m/QuyWxGt9AQAJ
// https://github.com/google/closure-library/issues/903
// https://github.com/google/blockly/issues/1901#issuecomment-396741501

class EarthEngineWorker {
    constructor(options = {}) {
        this.options = options
    }

    // Set EE API auth token if not already set
    static async setAuthToken(getAuthToken) {
        new Promise(async (resolve, reject) => {
            if (!ee.data.getAuthToken()) {
                const {
                    client_id,
                    tokenType = 'Bearer',
                    access_token,
                    expires_in,
                } = await getAuthToken()

                const extraScopes = null
                const updateAuthLibrary = false

                ee.data.setAuthToken(
                    client_id,
                    tokenType,
                    access_token,
                    expires_in,
                    extraScopes,
                    () => ee.initialize(null, null, resolve, reject),
                    updateAuthLibrary
                )

                ee.data.setAuthTokenRefresher(async (authArgs, callback) =>
                    callback({
                        ...(await getAuthToken()),
                        state: authArgs.scope,
                    })
                )
            } else resolve()
        })
    }

    getFeatureCollection() {
        const { data, buffer } = this.options

        if (Array.isArray(data) && !this.eeFeatureCollection) {
            this.eeFeatureCollection = ee.FeatureCollection(
                data.map(feature => ({
                    ...feature,
                    id: feature.properties.id, // EE requires id to be string, MapLibre integer
                    // Translate points to buffer polygons
                    geometry:
                        buffer && feature.geometry.type === 'Point'
                            ? getBufferGeometry(feature, buffer / 1000)
                            : feature.geometry,
                }))
            )
        }

        return this.eeFeatureCollection
    }

    getImage() {
        if (this.eeImage) {
            return this.eeImage
        }

        const {
            datasetId,
            filter,
            mosaic,
            band,
            bandReducer,
            mask,
            methods,
        } = this.options

        let eeImage

        if (!filter) {
            eeImage = ee.Image(datasetId)
            this.eeScale = getScale(eeImage)
        } else {
            let collection = ee.ImageCollection(datasetId)

            // Scale is lost when creating a mosaic below
            // https://developers.google.com/earth-engine/guides/projections
            this.eeScale = getScale(collection.first())

            // Apply array of filters (e.g. period)
            filter.forEach(f => {
                collection = collection.filter(
                    ee.Filter[f.type].apply(this, f.arguments)
                )
            })

            eeImage = mosaic
                ? collection.mosaic() // Composite all images inn a collection (e.g. per country)
                : ee.Image(collection.first()) // There should only be one image after applying the filters
        }

        // // Select band (e.g. age group)
        if (band) {
            eeImage = eeImage.select(band)

            if (Array.isArray(band) && bandReducer) {
                // Combine multiple bands (e.g. age groups)
                eeImage = eeImage.reduce(ee.call(`Reducer.${bandReducer}`))
            }
        }

        // Mask out 0-values
        if (mask) {
            eeImage = eeImage.updateMask(eeImage.gt(0))
        }

        // Run methods on image
        if (methods) {
            Object.keys(methods).forEach(method => {
                if (eeImage[method]) {
                    eeImage = eeImage[method].apply(eeImage, methods[method])
                }
            })
        }

        this.eeImage = eeImage

        return eeImage
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

    getTileUrl() {
        const { data, params } = this.options

        return new Promise(async resolve => {
            this.eeImage = this.getImage()

            let eeImage = this.classifyImage(this.eeImage)

            if (data) {
                eeImage = eeImage.clipToCollection(this.getFeatureCollection())
            }

            eeImage
                .visualize(this.params || params)
                .getMap(null, response => resolve(response.urlFormat))
        })
    }

    async getValue(lnglat) {
        const { lng, lat } = lnglat
        const eeImage = await this.getImage()
        const point = ee.Geometry.Point(lng, lat)
        const reducer = ee.call('Reducer.mean')

        return getInfo(eeImage.reduceRegion(reducer, point, 1))
    }

    getPeriods(eeId) {
        const imageCollection = ee
            .ImageCollection(eeId)
            .distinct('system:time_start')
            .sort('system:time_start', false)

        const featureCollection = ee
            .FeatureCollection(imageCollection)
            .select(['system:time_start', 'system:time_end'], null, false)

        return getInfo(featureCollection)
    }

    // Need to be able to get aggregations in "isolation" for import/export app
    // https://code.earthengine.google.com/980cb8f260423cc536092a76d6d2db51
    async getAggregations() {
        const { aggregationType, legend } = this.options
        const singleAggregation = !Array.isArray(aggregationType)
        const useHistogram =
            singleAggregation && hasClasses(aggregationType) && legend
        const image = await this.getImage()
        const collection = this.getFeatureCollection() // TODO: Throw error if no feature collection
        const scale = this.eeScale

        if (useHistogram) {
            // Used for landcover
            const reducer = ee.call('Reducer.frequencyHistogram')
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
        } else if (!singleAggregation && aggregationType.length) {
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
}

expose(EarthEngineWorker)
