import Layer from './Layer'
import getEarthEngineApi from '../utils/eeapi'
import { getCrs, combineReducers } from '../utils/earthengine'
import { featureCollection } from '../utils/geometry'
import { polygonLayer, outlineLayer } from '../utils/layers'

const defaultOptions = {
    url:
        'https://earthengine.googleapis.com/map/{mapid}/{z}/{x}/{y}?token={token}',
    tokenType: 'Bearer',
    aggregation: 'none',
    popup: '{name}: {value} {unit}',
}

class EarthEngine extends Layer {
    constructor(options) {
        super({
            ...defaultOptions,
            ...options,
        })

        this._legend = options.legend || this.createLegend()
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

        this._ee = await getEarthEngineApi()

        await this.setAuthToken()

        this.createFeatureCollection()

        this._eeMap = await this.visualize(this.createImage())

        this.setSource(id, {
            type: 'raster',
            tileSize: 256,
            tiles: [this._eeMap.urlFormat],
        })

        this.addLayer({
            id: `${id}-raster`,
            type: 'raster',
            source: id,
        })

        this.addFeatures()

        return this._source
    }

    // Configures client-side authentication of EE API calls by providing a OAuth2 token to use.
    setAuthToken = () =>
        new Promise((resolve, reject) => {
            const { accessToken, tokenType } = this.options

            if (accessToken) {
                accessToken.then(token => {
                    const { access_token, client_id, expires_in } = token

                    this._ee.data.setAuthToken(
                        client_id,
                        tokenType,
                        access_token,
                        expires_in
                    )

                    this._ee.data.setAuthTokenRefresher(
                        this.refreshAccessToken.bind(this)
                    )

                    this._ee.initialize(null, null, resolve)
                })
            }
        })

    // Get OAuth2 token needed to create and load Google Earth Engine layers
    getAuthToken(callback) {
        const accessToken = this.options.accessToken
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
        const features = this.getFeatures()

        if (features.length) {
            this._featureCollection = this._ee.FeatureCollection(
                this.getFeatures().map(f => ({
                    ...f,
                    id: f.properties.id, // EE requries id to be string, Mapbox integer
                }))
            )
        }
    }

    // Create EE tile layer from params (override for each layer type)
    createImage() {
        // eslint-disable-line
        const options = this.options

        let eeCollection
        let eeImage

        if (options.filter) {
            // Image collection
            eeCollection = this._ee.ImageCollection(options.datasetId) // eslint-disable-line

            eeCollection = this.applyFilter(eeCollection)

            if (options.aggregation === 'mosaic') {
                this.eeCollection = eeCollection
                eeImage = eeCollection.mosaic()
            } else {
                eeImage = this._ee.Image(eeCollection.first()) // eslint-disable-line
            }
        } else {
            // Single image
            eeImage = this._ee.Image(options.datasetId) // eslint-disable-line
        }

        if (options.band) {
            eeImage = eeImage.select(options.band)
        }

        if (options.mask) {
            // Mask out 0-values
            eeImage = eeImage.updateMask(eeImage.gt(0))
        }

        // Run methods on image
        eeImage = this.runMethods(eeImage)

        this.eeImage = eeImage

        // Image is ready for aggregations
        this.fire('image')

        // Classify image
        if (!options.legend) {
            // Don't classify if legend is provided
            eeImage = this.classifyImage(eeImage)
        }

        return eeImage
    }

    createLegend() {
        const params = this.options.params
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

        if (filter) {
            filter.forEach(item => {
                collection = collection.filter(
                    this._ee.Filter[item.type].apply(this, item.arguments)
                ) // eslint-disable-line
            })
        }

        return collection
    }

    // Run methods on image
    runMethods(image) {
        const methods = this.options.methods
        let eeImage = image

        if (methods) {
            Object.keys(methods).forEach(method => {
                if (eeImage[method]) {
                    // Make sure method exist
                    eeImage = eeImage[method].apply(eeImage, methods[method]) // eslint-disable-line
                }
            })
        }

        return eeImage
    }

    // Classify image according to legend
    classifyImage(eeImage) {
        const legend = this._legend
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

        if (this._featureCollection) {
            eeImage = eeImage.clipToCollection(this._featureCollection)
        }

        return new Promise(resolve =>
            eeImage
                .visualize(
                    legend
                        ? params
                        : {
                              min: 0,
                              max: this._legend.length - 1,
                              palette: params.palette,
                          }
                )
                .getMap(null, resolve)
        )
    }

    // Returns value at location in a callback
    getValue(latlng, callback) {
        const point = this._ee.Geometry.Point(latlng.lng, latlng.lat) // eslint-disable-line
        const options = this.options
        let dictionary

        if (options.aggregation === 'mosaic') {
            dictionary = this.eeImage.reduceRegion(
                this._ee.Reducer.mean(),
                point,
                options.resolution,
                options.projection
            ) // eslint-disable-line
        } else {
            dictionary = this.eeImage.reduceRegion(
                this._ee.Reducer.mean(),
                point
            ) // eslint-disable-line
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
            const { aggregationTypes } = this.options
            const image = await this.getImage()
            const collection = this._featureCollection
            const ee = this._ee

            if (collection && aggregationTypes && aggregationTypes.length) {
                const reducer = combineReducers(ee)(aggregationTypes)
                const { crs, crsTransform } = getCrs(ee)(image) // Only needed for mosaics

                const aggFeatures = image
                    .reduceRegions({
                        collection,
                        reducer,
                        crs,
                        crsTransform,
                    })
                    .select(aggregationTypes, null, false) // Only return values

                aggFeatures.getInfo((data, error) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(
                            data.features.reduce(
                                (obj, f) => ({
                                    ...obj,
                                    [f.id]: f.properties,
                                }),
                                {}
                            )
                        )
                    }
                })
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
