import { expose } from 'comlink'
import ee from './ee_api_js_worker' // https://github.com/google/earthengine-api/pull/173
// import { ee } from '@google/earthengine/build/ee_api_js_debug' // Run "yarn add @google/earthengine"
import {
    getInfo,
    getScale,
    hasClasses,
    combineReducers,
    getClassifiedImage,
    getHistogramStatistics,
    getFeatureCollectionProperties,
} from './ee_worker_utils'
import { getBufferGeometry } from '../utils/buffers'

// Why we need to "hack" the '@google/earthengine bundle:
// https://groups.google.com/g/google-earth-engine-developers/c/nvlbqxrnzDk/m/QuyWxGt9AQAJ

const FEATURE_STYLE = { color: 'FFA500', strokeWidth: 2 }
const DEFAULT_TILE_SCALE = 1

class EarthEngineWorker {
    constructor(options = {}) {
        this.options = options
    }

    // Set EE API auth token if needed and run ee.initialize
    static setAuthToken = getAuthToken =>
        new Promise((resolve, reject) => {
            if (ee.data.getAuthToken()) {
                // Already authenticated
                ee.initialize(null, null, resolve, reject)
            } else {
                getAuthToken()
                    .then(token => {
                        const {
                            client_id,
                            tokenType = 'Bearer',
                            access_token,
                            expires_in,
                        } = token

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

                        ee.data.setAuthTokenRefresher(
                            async (authArgs, callback) =>
                                callback({
                                    ...(await getAuthToken()),
                                    state: authArgs.scope,
                                })
                        )
                    })
                    .catch(reject)
            }
        })

    //Reset all the class data so that a different
    //set of options can be used
    setOptions(options) {
        this.options = options
        this.eeFeatureCollection = null
        this.eeImage = null
        this.eeImageBands = null
        this.eeScale = null

        return this
    }

    // Translate org unit features to an EE feature collection
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

    // Returns a single image that can styled as raster tiles
    getImage() {
        if (this.eeImage) {
            return this.eeImage
        }

        const { datasetId, filter, mosaic, band, bandReducer, mask, methods } =
            this.options

        let eeImage

        if (!filter) {
            // Single image
            eeImage = ee.Image(datasetId)
            this.eeScale = getScale(eeImage)
        } else {
            // Image collection
            let collection = ee.ImageCollection(datasetId)

            // Scale is lost when creating a mosaic below
            this.eeScale = getScale(collection.first())

            // Apply array of filters (e.g. period)
            filter.forEach(f => {
                collection = collection.filter(
                    // ee.Filter[f.type].apply(this, f.arguments)
                    ee.Filter[f.type](f.name, f.value)
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
                // Keep image bands for aggregations
                this.eeImageBands = eeImage

                // Combine multiple bands (e.g. age groups)
                eeImage = eeImage.reduce(ee.Reducer[bandReducer]())
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

    // Returns raster tile url for a classified image
    getTileUrl() {
        const { format, data } = this.options

        return new Promise(resolve => {
            if (format === 'FeatureCollection') {
                const { datasetId } = this.options

                let dataset = ee
                    .FeatureCollection(datasetId)
                    .draw(FEATURE_STYLE)

                if (data) {
                    dataset = dataset.clipToCollection(
                        this.getFeatureCollection()
                    )
                }

                dataset.getMap(null, response => resolve(response.urlFormat))
            } else {
                let { eeImage, params } = getClassifiedImage(
                    this.getImage(),
                    this.options
                )

                if (data) {
                    eeImage = eeImage.clipToCollection(
                        this.getFeatureCollection()
                    )
                }

                eeImage.visualize(params).getMap(null, response => {
                    console.log('response', response)
                    return resolve(response.urlFormat)
                })
            }
        })
    }

    // Returns the data value  at a position
    async getValue(lnglat) {
        const { lng, lat } = lnglat
        const eeImage = await this.getImage()
        const point = ee.Geometry.Point(lng, lat)
        const reducer = ee.Reducer.mean()

        return getInfo(eeImage.reduceRegion(reducer, point, 1))
    }

    // Returns available periods for an image collection
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

    // Returns aggregated values for org unit features
    async getAggregations(config) {
        if (config) {
            this.setOptions(config)
        }
        const {
            format,
            aggregationType,
            band,
            style,
            tileScale = DEFAULT_TILE_SCALE,
        } = this.options
        const singleAggregation = !Array.isArray(aggregationType)
        const useHistogram =
            singleAggregation &&
            hasClasses(aggregationType) &&
            Array.isArray(style)
        const image = await this.getImage()
        const scale = this.eeScale
        const collection = this.getFeatureCollection() // TODO: Throw error if no feature collection

        if (collection) {
            if (format === 'FeatureCollection') {
                const { datasetId } = this.options
                const dataset = ee.FeatureCollection(datasetId)

                const aggFeatures = collection
                    .map(feature => {
                        feature = ee.Feature(feature)
                        const count = dataset
                            .filterBounds(feature.geometry())
                            .size()

                        return feature.set('count', count)
                    })
                    .select(['count'], null, false)

                return getInfo(aggFeatures).then(getFeatureCollectionProperties)
            } else if (useHistogram) {
                // Used for landcover
                const reducer = ee.Reducer.frequencyHistogram()
                const scaleValue = await getInfo(scale)

                return getInfo(
                    image
                        .reduceRegions({
                            collection,
                            reducer,
                            scale,
                            tileScale,
                        })
                        .select(['histogram'], null, false)
                ).then(data =>
                    getHistogramStatistics({
                        data,
                        scale: scaleValue,
                        aggregationType,
                        style,
                    })
                )
            } else if (!singleAggregation && aggregationType.length) {
                const reducer = combineReducers(ee)(aggregationType)
                const props = [...aggregationType]

                let aggFeatures = image.reduceRegions({
                    collection,
                    reducer,
                    scale,
                    tileScale,
                })

                if (this.eeImageBands) {
                    aggFeatures = this.eeImageBands.reduceRegions({
                        collection: aggFeatures,
                        reducer,
                        scale,
                        tileScale,
                    })

                    band.forEach(band =>
                        aggregationType.forEach(type =>
                            props.push(
                                aggregationType.length === 1
                                    ? band
                                    : `${band}_${type}`
                            )
                        )
                    )
                }

                aggFeatures = aggFeatures.select(props, null, false)

                return getInfo(aggFeatures).then(getFeatureCollectionProperties)
            } else throw new Error('Aggregation type is not valid')
        } else throw new Error('Missing org unit features')
    }
}

// Service Worker not supported in Safari
if (typeof onconnect !== 'undefined') {
    onconnect = evt => expose(EarthEngineWorker, evt.ports[0])
} else {
    expose(EarthEngineWorker)
}
