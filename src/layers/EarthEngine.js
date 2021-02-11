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
import { setPrecision } from '../utils/numbers'

const defaultOptions = {
    url:
        'https://earthengine.googleapis.com/map/{mapid}/{z}/{x}/{y}?token={token}',
    tokenType: 'Bearer',
    aggregation: 'none',
    bandReducer: 'sum',
    popup: '{name}: {value} {unit}',
}

// Support DHIS2 Maps 2.34 and above
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

    async getSource() {
        const id = this.getId()

        this.ee = await getEarthEngineApi()

        await this.setAuthToken()

        this.createFeatureCollection()

        const image = await this.createImage()

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

        this.onLoad()

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

    // Add layers to show org units above image layer
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

    // Create feature collection for org unit aggregations
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
    createImage = async () => {
        const { datasetId, band, bandReducer, mask, legend } = this.options

        const { Reducer } = this.ee

        // Apply filter (e.g. period)
        let eeImage = await this.applyFilter(datasetId)

        // Select band(s)
        if (band) {
            eeImage = eeImage.select(band)

            if (Array.isArray(band) && bandReducer && Reducer[bandReducer]) {
                // Combine multiple bands (e.g. age groups)
                eeImage = eeImage.reduce(Reducer[bandReducer]())
            }
        }

        // Mask out 0-values
        if (mask) {
            eeImage = eeImage.updateMask(eeImage.gt(0))
        }

        // Run methods on image
        eeImage = this.runMethods(eeImage)

        this.eeImage = eeImage

        // Image is ready for aggregations
        this.fire('imageready', { type: 'imageready', image: eeImage })

        // Classify image if no legend is provided
        return legend ? eeImage : this.classifyImage(eeImage)
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

        // Clip image to org unit features
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

    // Returns value at at position
    getValue = async latlng => {
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
    aggregate = async () => {
        const { aggregationType, classes, legend } = this.options
        const image = await this.getImage()
        const collection = this.featureCollection
        const scale = this.scale
        const { Reducer } = this.ee

        console.log('aggregate', scale)

        if (classes && legend) {
            // Used for landcover
            const reducer = Reducer.frequencyHistogram()
            const valueType = Array.isArray(aggregationType)
                ? aggregationType[0]
                : null

            return getInfo(
                image
                    .reduceRegions(collection, reducer, scale)
                    .select(['histogram'], null, false)
            ).then(data =>
                getHistogramStatistics({
                    data,
                    scale,
                    valueType,
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

        if (mapgl.getLayer(layerId)) {
            // Clickable polygon layer should always be transparent
            mapgl.setPaintProperty(layerId, 'fill-opacity', 0)
        }
    }
}

export default EarthEngine
