import { expose } from 'comlink'
import { ee } from './ee_api_js'
// import { ee } from '@google/earthengine/build/ee_api_js_debug' // Run "yarn add @google/earthengine"
import { getScale } from './ee_utils'

// Why we need to "hack" the '@google/earthengine bundle:
// https://groups.google.com/g/google-earth-engine-developers/c/nvlbqxrnzDk/m/QuyWxGt9AQAJ
// https://github.com/google/closure-library/issues/903
// https://github.com/google/blockly/issues/1901#issuecomment-396741501

let eeImage
let eeScale
let eeFeatureCollection

const setAuthToken = ({ client_id, tokenType, access_token, expires_in }) =>
    new Promise((resolve, reject) => {
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

        // ee.data.setAuthTokenRefresher(refreshAccessToken)

        ee.initialize(null, null, resolve, reject)
    })

const setFeatureCollection = features => {
    eeFeatureCollection = ee.FeatureCollection(
        features.map(f => ({
            ...f,
            id: f.properties.id, // EE requires id to be string, MapLibre integer
        }))
    )
}

const getTileUrl = ({
    datasetId,
    filter,
    mosaic,
    band,
    bandReducer,
    mask,
    methods,
    legend = [],
    params,
}) =>
    new Promise(async resolve => {
        console.log('progress')

        if (!filter) {
            eeImage = ee.Image(datasetId)
            eeScale = await getScale(eeImage)
        } else {
            let collection = ee.ImageCollection(datasetId)

            eeScale = await getScale(collection.first())

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

        // Classify image
        const min = 0
        const max = legend.length - 1
        let zones

        for (let i = min, item; i < max; i++) {
            item = legend[i]

            if (!zones) {
                zones = eeImage.gt(item.to)
            } else {
                zones = zones.add(eeImage.gt(item.to))
            }
        }

        if (eeFeatureCollection) {
            eeImage = eeImage.clipToCollection(eeFeatureCollection)
        }

        eeImage.visualize(params).getMap(null, response => {
            resolve(response.urlFormat)
        })
    })

expose({
    setAuthToken,
    setFeatureCollection,
    getTileUrl,
})
