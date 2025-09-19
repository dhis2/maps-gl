import polygonBuffer from '@turf/buffer'
import circle from '@turf/circle'
import { expose } from 'comlink'
import ee from './ee_api_js_worker.js' // https://github.com/google/earthengine-api/pull/173
import {
    getInfo,
    getScale,
    hasClasses,
    combineReducers,
    getClassifiedImage,
    getHistogramStatistics,
    getFeatureCollectionProperties,
    applyFilter,
    applyMethods,
    applyCloudMask,
} from './ee_worker_utils.js'

const IMAGE = 'Image'
const IMAGE_COLLECTION = 'ImageCollection'
const FEATURE_COLLECTION = 'FeatureCollection'

const getBufferGeometry = ({ geometry }, buffer) =>
    (geometry.type === 'Point'
        ? circle(geometry, buffer)
        : polygonBuffer(geometry, buffer)
    ).geometry

// Options are defined here:
// https://developers.google.com/earth-engine/apidocs/ee-featurecollection-draw
const DEFAULT_FEATURE_STYLE = {
    color: '#FFA500',
    strokeWidth: 2,
    pointRadius: 5,
}
const DEFAULT_TILE_SCALE = 1

const DEFAULT_UNMASK_VALUE = 0

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

        const {
            datasetId,
            format,
            filter,
            periodReducer,
            mosaic,
            band,
            bandReducer,
            methods,
            cloudScore,
        } = this.options

        let eeImage

        if (format === IMAGE) {
            // Single image
            eeImage = ee.Image(datasetId)
            this.eeScale = getScale(eeImage)
        } else {
            // Image collection
            let collection = ee.ImageCollection(datasetId)

            // Scale is lost when creating a mosaic below
            this.eeScale = getScale(collection.first())

            // Apply array of filters (e.g. period)
            collection = applyFilter(collection, filter)

            // Mask out clouds from satellite images
            if (cloudScore) {
                collection = applyCloudMask(collection, cloudScore)
            }

            if (periodReducer) {
                // Apply period reducer (e.g. going from daily to monthly)
                eeImage = collection[periodReducer]()
            } else if (mosaic) {
                // Composite all images inn a collection (e.g. per country)
                eeImage = collection.mosaic()
            } else {
                // There should only be one image after applying the filters
                eeImage = ee.Image(collection.first())
            }
        }

        // Select band (e.g. age group)
        if (band) {
            eeImage = eeImage.select(band)

            if (Array.isArray(band) && bandReducer) {
                // Keep image bands for aggregations
                this.eeImageBands = eeImage

                // Combine multiple bands (e.g. age groups)
                eeImage = eeImage.reduce(ee.Reducer[bandReducer]())
            }
        }

        // Run methods on image
        eeImage = applyMethods(eeImage, methods)

        this.eeImage = eeImage

        return eeImage
    }

    // Returns raster tile url for a classified image
    getTileUrl() {
        const { datasetId, format, data, filter, style } = this.options

        return new Promise((resolve, reject) => {
            switch (format) {
                case FEATURE_COLLECTION: {
                    let dataset = ee.FeatureCollection(datasetId)

                    dataset = applyFilter(dataset, filter).draw({
                        ...DEFAULT_FEATURE_STYLE,
                        ...style,
                    })

                    if (data) {
                        dataset = dataset.clipToCollection(
                            this.getFeatureCollection()
                        )
                    }

                    dataset.getMap(null, response =>
                        resolve(response.urlFormat)
                    )

                    break
                }
                case IMAGE:
                case IMAGE_COLLECTION: {
                    // eslint-disable-next-line prefer-const
                    let { eeImage, params } = getClassifiedImage(
                        this.getImage(),
                        this.options
                    )

                    if (data) {
                        eeImage = eeImage.clipToCollection(
                            this.getFeatureCollection()
                        )
                    }

                    eeImage
                        .visualize(params)
                        .getMap(null, response => resolve(response.urlFormat))

                    break
                }
                default:
                    reject(new Error('Unknown format'))
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
            .select(
                ['system:time_start', 'system:time_end', 'year'],
                null,
                false
            )

        return getInfo(featureCollection)
    }

    // Returns min and max timestamp for an image collection
    getTimeRange(eeId) {
        const collection = ee.ImageCollection(eeId)

        const range = collection.reduceColumns(ee.Reducer.minMax(), [
            'system:time_start',
        ])

        return getInfo(range)
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
            useCentroid,
            style,
            tileScale = DEFAULT_TILE_SCALE,
            unmaskAggregation,
        } = this.options
        const singleAggregation = !Array.isArray(aggregationType)
        const useHistogram =
            singleAggregation &&
            hasClasses(aggregationType) &&
            Array.isArray(style)
        const scale = this.eeScale
        const collection = this.getFeatureCollection()
        let image = await this.getImage()

        // Used for "constrained" WorldPop layers
        // We need to unmask the image to get the correct population density
        if (unmaskAggregation || typeof unmaskAggregation === 'number') {
            const fillValue =
                typeof unmaskAggregation === 'number'
                    ? unmaskAggregation
                    : DEFAULT_UNMASK_VALUE
        
            image = image.unmask(fillValue)
        
            if (this.eeImageBands) {
                this.eeImageBands = this.eeImageBands.unmask(fillValue)
            }
        }

        if (collection) {
            if (format === FEATURE_COLLECTION) {
                const { datasetId, filter } = this.options
                let dataset = ee.FeatureCollection(datasetId)

                dataset = applyFilter(dataset, filter)

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
                const reducer = combineReducers(aggregationType, useCentroid)
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
            } else {
                throw new Error('Aggregation type is not valid')
            }
        } else {
            throw new Error('Missing org unit features')
        }
    }
}

// Service Worker not supported in Safari
if (typeof onconnect !== 'undefined') {
    // eslint-disable-next-line no-undef
    onconnect = evt => expose(EarthEngineWorker, evt.ports[0])
} else {
    expose(EarthEngineWorker)
}

export default ''
