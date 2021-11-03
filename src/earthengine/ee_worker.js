import { expose, proxy } from 'comlink'
import ee from './ee_api_js_worker' // https://github.com/google/earthengine-api/pull/173
// import { ee } from '@google/earthengine/build/ee_api_js_debug' // Run "yarn add @google/earthengine"
import { getScale } from './ee_utils'

// Why we need to "hack" the '@google/earthengine bundle:
// https://groups.google.com/g/google-earth-engine-developers/c/nvlbqxrnzDk/m/QuyWxGt9AQAJ
// https://github.com/google/closure-library/issues/903
// https://github.com/google/blockly/issues/1901#issuecomment-396741501

class EarthEngineWorker {
    constructor() {}

    // Set EE API auth token if not already set
    setAuthToken(token, refreshAuthToken) {
        if (token && !ee.data.getAuthToken()) {
            const { client_id, tokenType, access_token, expires_in } = token
            const extraScopes = null
            const callback = null
            const updateAuthLibrary = false

            ee.data.setAuthToken(
                client_id,
                tokenType,
                access_token,
                expires_in,
                extraScopes,
                callback,
                updateAuthLibrary
            )
        }

        if (refreshAuthToken) {
            ee.data.setAuthTokenRefresher((authArgs, callback) =>
                refreshAuthToken(authArgs, proxy(callback))
            )
        }
    }

    // Initialise EE API
    // https://developers.google.com/earth-engine/apidocs/ee-initialize
    initialize() {
        return new Promise((resolve, reject) => {
            ee.initialize(null, null, resolve, reject)
        })
    }

    setFeatureCollection(features) {
        this.eeFeatureCollection = ee.FeatureCollection(
            features.map(f => ({
                ...f,
                id: f.properties.id, // EE requires id to be string, MapLibre integer
            }))
        )
    }

    getImage(options) {
        const {
            datasetId,
            filter,
            mosaic,
            band,
            bandReducer,
            mask,
            methods,
        } = options

        let eeImage

        if (!filter) {
            eeImage = ee.Image(datasetId)
            this.eeScale = getScale(eeImage)
        } else {
            let collection = ee.ImageCollection(datasetId)

            this.eeScale = getScale(collection.first())

            filter.forEach(f => {
                collection = collection.filter(
                    ee.Filter[f.type].apply(this, f.arguments)
                )
            })

            eeImage = mosaic
                ? collection.mosaic() // Composite all images inn a collection (e.g. per country)
                : ee.Image(collection.first()) // There should only be one image after applying the filters
        }

        if (band) {
            eeImage = eeImage.select(band)

            if (Array.isArray(band) && bandReducer && ee.Reducer[bandReducer]) {
                // Combine multiple bands (e.g. age groups)
                eeImage = eeImage.reduce(ee.Reducer[bandReducer]())
            }
        }

        if (mask) {
            eeImage = eeImage.updateMask(eeImage.gt(0))
        }

        if (methods) {
            Object.keys(methods).forEach(method => {
                if (eeImage[method]) {
                    eeImage = eeImage[method].apply(eeImage, methods[method])
                }
            })
        }

        return eeImage
    }

    classifyImage(eeImage, { legend = [], params }) {
        let zones

        /*
        if (!params) {
            // Image has classes (e.g. landcover)
            this.params = getParamsFromLegend(legend)
            return eeImage
        }
        */

        const min = 0
        const max = legend.length - 1
        // const { palette } = params

        for (let i = min, item; i < max; i++) {
            item = legend[i]

            if (!zones) {
                zones = eeImage.gt(item.to)
            } else {
                zones = zones.add(eeImage.gt(item.to))
            }
        }

        // Visualisation params
        // this.params = { min, max, palette }

        return zones
    }

    getTileUrl(options) {
        return new Promise(async resolve => {
            let eeImage = this.getImage(options)

            eeImage = this.classifyImage(eeImage, options)

            if (this.eeFeatureCollection) {
                eeImage = eeImage.clipToCollection(this.eeFeatureCollection)
            }

            eeImage.visualize(options.params).getMap(null, response => {
                resolve(response.urlFormat)
            })
        })
    }

    // Need to be able to get aggregations in "isolation" for import/export app
    // https://code.earthengine.google.com/980cb8f260423cc536092a76d6d2db51
    getAggregations(options) {
        // let eeImage = getImage(options) // TODO: use cache wait for promise to fullfill?
        // Scale needs to be retrieved before mosaic - return in promise above?
        // console.log('getAggregations')
    }
}

expose(EarthEngineWorker)