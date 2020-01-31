import Layer from './Layer'

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

    async getSource() {
        this._ee = await this.loadEarthEngineApi()

        await this.setAuthToken()

        const eeImage = this.createImage()
        const eeMap = await this.visualize(eeImage)

        const { mapid, token } = eeMap

        const url = `https://earthengine.googleapis.com/map/${mapid}/{z}/{x}/{y}?token=${token}`
        const tiles = [url]

        this.setSource(this.getId(), {
            type: 'raster',
            tiles,
            tileSize: 256,
        })

        this.addLayer({
            id: this.getId(),
            type: 'raster',
            source: this.getId(),
        })

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

    onValidAuthToken(token) {
        const { access_token, client_id, expires_in } = token
        const { tokenType } = this.options

        this._ee.data.setAuthToken(
            client_id,
            tokenType,
            access_token,
            expires_in
        )
        this._ee.data.setAuthTokenRefresher(this.refreshAccessToken.bind(this))
        this._ee.initialize(null, null, this.createImage.bind(this))
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

        // Classify image
        if (!options.legend) {
            // Don't classify if legend is provided
            eeImage = this.classifyImage(eeImage)
        }

        return eeImage
    }

    createLayer() {
        this.addLayer({
            id: this.getId(),
            type: 'raster',
            source: this.getId(),
        })
    }

    setOpacity(opacity) {}

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

    // Returns a HTML legend for this EE layer
    getLegend() {
        // eslint-disable-line
        const options = this.options
        let legend = '<div class="dhis2-legend">'

        legend += '<h2>' + options.name

        if (options.image) {
            legend += ' ' + options.image
        }

        legend += '</h2>'

        if (options.description) {
            legend += '<p>' + options.description + '</p>'
        }

        legend += '<dl>'

        if (options.unit) {
            legend += '<dt></dt><dd><strong>' + options.unit + '</strong></dd>'
        }

        for (let i = 0, item; i < this._legend.length; i++) {
            item = this._legend[i]
            legend +=
                '<dt style="background-color:' +
                item.color +
                ';box-shadow:1px 1px 2px #aaa;"></dt>'
            legend += '<dd>' + item.name
        }

        legend += '</dl>'

        if (options.attribution) {
            legend += '<p>Data: ' + options.attribution + '</p>'
        }

        legend += '<div>'

        return legend
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
    // https://code.earthengine.google.com/a19f5cec73720aba049b457d55672cee
    // https://code.earthengine.google.com/37e4e9cc4436a22e5c3e0f63acb4c0bc
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

    showValue(latlng) {
        console.log('showValue', latlng)
    }

    // Check if Earth Engine API is loaded
    earthEngineApiLoaded() {
        return typeof window.ee !== 'undefined'
    }

    // Load Earth Engine API
    /*
    loadEarthEngineApi() {
        EarthEngine._apiIsLoading = true

        const script = document.createElement('script'); 
        script.src = 'https://cdn.rawgit.com/google/earthengine-api/master/javascript/build/ee_api_js.js'; // TODO: Don't use master
        document.getElementsByTagName('head')[0].appendChild(script); 

        console.log('loadEarthEngineApi')
    }
    */

    // Inspired by https://gitlab.com/IvanSanchez/Leaflet.GridLayer.GoogleMutant/blob/master/Leaflet.GoogleMutant.js#L29
    // TODO Handle if two maps are requesting the api at the same time
    loadEarthEngineApi = () =>
        new Promise((resolve, reject) => {
            if (window.ee) {
                return resolve(window.ee)
            }

            const script = document.createElement('script')
            script.src =
                'https://cdn.rawgit.com/google/earthengine-api/v0.1.172/javascript/build/ee_api_js.js' // TODO: Safer to host overselves?
            document.getElementsByTagName('head')[0].appendChild(script)

            let checkCounter = 0
            let intervalId

            intervalId = setInterval(() => {
                if (checkCounter >= 40) {
                    clearInterval(intervalId)
                    return reject(
                        new Error('window.ee not found after 20 seconds')
                    )
                }
                if (!!window.ee) {
                    clearInterval(intervalId)
                    return resolve(window.ee)
                }
                checkCounter++
            }, 500)
        })
}

export default EarthEngine
