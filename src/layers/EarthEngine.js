import Layer from './Layer'
import getEarthEngineApi from '../utils/eeapi'
import {
    getInfo,
    getCrs,
    getScale,
    combineReducers,
    getHistogramStatistics,
    getFeatureCollectionProperties,
} from '../utils/earthengine'
import { featureCollection } from '../utils/geometry'
import { polygonLayer, outlineLayer } from '../utils/layers'

const defaultOptions = {
    url:
        'https://earthengine.googleapis.com/map/{mapid}/{z}/{x}/{y}?token={token}',
    tokenType: 'Bearer',
    aggregation: 'none',
    popup: '{name}: {value} {unit}',
}

const backwardCompability = options => {
    const opts = { ...options }

    if (opts.aggregation === 'mosaic') {
        opts.mosaic = true
    }

    return opts
}

class EarthEngine extends Layer {
    constructor(options) {
        super({
            ...defaultOptions,
            ...backwardCompability(options),
        })

        this.legend = options.legend || this.createLegend()
    }

    addFeatures() {
        const id = this.getId()
        const source = `${id}-features`

        this.setSource(source, {
            type: 'geojson',
            data: featureCollection(this.getFeatures()),
        })

        this.addLayer(polygonLayer({ id, source: source, opacity: 0.9 }), true)
        this.addLayer(outlineLayer({ id, source: source }))
    }

    async getSource() {
        const id = this.getId()

        this.ee = await getEarthEngineApi()

        await this.setAuthToken()

        this.createFeatureCollection()

        const image = this.createImage()

        this.eeMap = await this.visualize(image)

        if (this.eeMap) {
            this.setSource(id, {
                type: 'raster',
                tileSize: 256,
                tiles: [this.eeMap.urlFormat],
            })

            this.addLayer({
                id: `${id}-raster`,
                type: 'raster',
                source: id,
            })
        }

        this.addFeatures()

        this.onLoad() // TODO: Call after render or aggregation is done

        return this._source
    }

    // Configures client-side authentication of EE API calls by providing a OAuth2 token to use.
    setAuthToken = () =>
        new Promise((resolve, reject) => {
            const { data, initialize } = this.ee
            const { accessToken, tokenType } = this.options

            if (accessToken) {
                accessToken
                    .then(token => {
                        const { access_token, client_id, expires_in } = token

                        data.setAuthToken(
                            client_id,
                            tokenType,
                            access_token,
                            expires_in
                        )

                        data.setAuthTokenRefresher(
                            this.refreshAccessToken.bind(this)
                        )

                        initialize(null, null, resolve)
                    })
                    .catch(reject)
            }
        })

    // Get OAuth2 token needed to create and load Google Earth Engine layers
    getAuthToken(callback) {
        const { accessToken } = this.options

        if (accessToken) {
            if (accessToken instanceof Function) {
                // Callback function returning auth obect
                accessToken(callback)
            } else {
                // Auth token as object
                callback(accessToken)
            }
        }
    }

    // Refresh OAuth2 token when expired
    refreshAccessToken(authArgs, callback) {
        const { tokenType } = this.options

        this.getAuthToken(token => {
            callback({
                token_type: tokenType,
                access_token: token.access_token,
                state: authArgs.scope,
                expires_in: token.expires_in,
            })
        })
    }

    createFeatureCollection() {
        const { FeatureCollection } = this.ee
        const features = this.getFeatures()

        if (features.length) {
            this.featureCollection = FeatureCollection(
                features.map(f => ({
                    ...f,
                    id: f.properties.id, // EE requries id to be string, Mapbox integer
                }))
            )
        }
    }

    // Create EE tile layer from params
    createImage() {
        const { Image, ImageCollection, Reducer } = this.ee
        const {
            datasetId,
            band,
            filter,
            reducer,
            mosaic,
            mask,
            legend,
        } = this.options

        let eeCollection
        let eeImage

        if (filter) {
            // Image collection
            eeCollection = ImageCollection(datasetId)
            eeCollection = this.applyFilter(eeCollection)

            if (mosaic) {
                this.eeCollection = eeCollection
                eeImage = eeCollection.mosaic()
            } else if (reducer && Reducer[reducer]) {
                eeImage = eeCollection.reduce(Reducer[reducer]())
            } else {
                eeImage = Image(eeCollection.first())
            }
        } else {
            // Single image
            eeImage = Image(datasetId)
        }

        if (band) {
            eeImage = eeImage.select(`${band}${reducer ? `_${reducer}` : ''}`)
        }

        if (mask) {
            // Mask out 0-values
            eeImage = eeImage.updateMask(eeImage.gt(0))
        }

        // Run methods on image
        eeImage = this.runMethods(eeImage)

        this.eeImage = eeImage

        // Image is ready for aggregations
        this.fire('image')

        // Classify image if no legend is provided
        if (!legend) {
            eeImage = this.classifyImage(eeImage)
        }

        return eeImage
    }

    // TODO: Needed?
    createLegend() {
        const { params } = this.options
        const min = params.min
        const max = params.max
        const palette = params.palette.split(',')
        const step = (params.max - min) / (palette.length - (min > 0 ? 2 : 1))

        let from = min
        let to = Math.round(min + step)

        return palette.map((color, index) => {
            const item = { color }

            if (index === 0 && min > 0) {
                // Less than min
                item.from = 0
                item.to = min
                item.name = '< ' + item.to
                to = min
            } else if (from < max) {
                item.from = from
                item.to = to
                item.name = item.from + ' - ' + item.to
            } else {
                // Higher than max
                item.from = from
                item.name = '> ' + item.from
            }

            from = to
            to = Math.round(min + step * (index + (min > 0 ? 1 : 2)))

            return item
        })
    }

    applyFilter(collection, filterOpt) {
        const filter = filterOpt || this.options.filter
        const { Filter } = this.ee

        if (filter) {
            filter.forEach(item => {
                collection = collection.filter(
                    Filter[item.type].apply(this, item.arguments)
                )
            })
        }

        return collection
    }

    // Run methods on image
    runMethods(image) {
        const { methods } = this.options
        let eeImage = image

        if (methods) {
            Object.keys(methods).forEach(method => {
                if (eeImage[method]) {
                    eeImage = eeImage[method].apply(eeImage, methods[method])
                }
            })
        }

        return eeImage
    }

    // Classify image according to legend
    classifyImage(eeImage) {
        const legend = this.legend
        let zones

        for (let i = 0, item; i < legend.length - 1; i++) {
            item = legend[i]
            if (!zones) {
                zones = eeImage.gt(item.to)
            } else {
                zones = zones.add(eeImage.gt(item.to))
            }
        }

        return zones
    }

    // Visualize image (turn into RGB)
    visualize(eeImage) {
        const { legend, params } = this.options

        if (this.featureCollection) {
            eeImage = eeImage.clipToCollection(this.featureCollection)
        }

        return new Promise(resolve =>
            eeImage
                .visualize(
                    legend
                        ? params
                        : {
                              min: 0,
                              max: this.legend.length - 1,
                              palette: params.palette,
                          }
                )
                .getMap(null, resolve)
        )
    }

    // Returns value at location in a callback
    getValue(latlng, callback) {
        const { Geometry, Reducer } = this.ee
        const point = Geometry.Point(latlng.lng, latlng.lat)
        const options = this.options
        let dictionary

        if (options.mosaic) {
            dictionary = this.eeImage.reduceRegion(
                Reducer.mean(),
                point,
                1,
                'EPSG:4326' // TODO
            )
        } else {
            dictionary = this.eeImage.reduceRegion(Reducer.mean(), point)
        }

        dictionary.getInfo(valueObj => {
            const band = options.band || Object.keys(valueObj)[0]
            let value = valueObj[band]

            if (options.legend && options.legend[value]) {
                value = options.legend[value].name
            } else if (options.value) {
                // Needs calculation
                value = options.value(value)
            }

            callback(value)
        })
    }

    // TODO: Move popup handling to the maps app
    showValue = latlng => {
        this.getValue(latlng, value => {
            const { lng, lat } = latlng
            const options = {
                ...this.options,
                value,
            }

            const content = options.popup.replace(
                /\{ *([\w_-]+) *\}/g,
                (str, key) => options[key]
            )

            this._map.openPopup(document.createTextNode(content), [lng, lat])
        })
    }

    getImage = () =>
        new Promise(resolve =>
            this.eeImage
                ? resolve(this.eeImage)
                : this.once('image', () => resolve(this.eeImage))
        )

    aggregate = () =>
        new Promise(async (resolve, reject) => {
            const { aggregationType, classes, legend } = this.options
            const image = await this.getImage()
            const collection = this.featureCollection
            const ee = this.ee

            if (classes && legend) {
                const scale = await getScale(image)
                const reducer = ee.Reducer.frequencyHistogram()

                getInfo(
                    image
                        .reduceRegions(collection, reducer, scale)
                        .select(['histogram'], null, false)
                ).then(data =>
                    resolve(
                        getHistogramStatistics({
                            data,
                            scale,
                            aggregationType,
                            legend,
                        })
                    )
                )
            } else if (
                collection &&
                aggregationType &&
                aggregationType.length
            ) {
                const { crs, crsTransform } = await getCrs(ee)(
                    this.eeCollection || image
                ) // Only needed for mosaics
                const reducer = combineReducers(ee)(aggregationType)

                const aggFeatures = image
                    .reduceRegions({
                        collection,
                        reducer,
                        crs,
                        crsTransform,
                    })
                    .select(aggregationType, null, false) // Only return values

                aggFeatures.getInfo((data, error) =>
                    error
                        ? reject(error)
                        : resolve(getFeatureCollectionProperties(data))
                )
            }
        })

    setOpacity(opacity) {
        super.setOpacity(opacity)

        // Clickable polygon layer should always be transparent
        const id = this.getId()
        const layerId = `${id}-polygon`
        const mapgl = this.getMapGL()

        if (mapgl.getLayer(layerId)) {
            mapgl.setPaintProperty(layerId, 'fill-opacity', 0)
        }
    }
}

export default EarthEngine
