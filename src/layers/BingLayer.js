import Layer from './Layer'
import { fetchJsonp } from '../utils/jsonp'

const key = 'AotYGLQC0RDcofHC5pWLaW7k854n-6T9mTunsev9LEFwVqGaVnG8b4KERNY9PeKA' // TODO: Don't push!

// http://dev.virtualearth.net/REST/V1/Imagery/Metadata/Road?output=json&include=ImageryProviders&key=BingMapsKey
// https://docs.microsoft.com/en-us/bingmaps/rest-services/directly-accessing-the-bing-maps-tiles
// https://github.com/mapbox/mapbox-gl-js/issues/4137
// https://github.com/mapbox/mapbox-gl-native/issues/4653
// https://github.com/digidem/leaflet-bing-layer
// TODO: Support for different locales // mkt={culture}
class BingLayer extends Layer {
    async createSource() {
        const { imageUrl, imageUrlSubdomains } = await this.loadMetaData()
        const tiles = imageUrlSubdomains.map(subdomain =>
            imageUrl.replace('{subdomain}', subdomain)
        )

        this.setSource(this.getId(), {
            type: 'raster',
            tiles,
            tileSize: 256,
            attribution: '',
        })
    }

    createLayer = () => {
        this.addLayer({
            id: this.getId(),
            type: 'raster',
            source: this.getId(),
        })
    }

    async addTo(map) {
        await this.createSource()
        this.createLayer()

        super.addTo(map)
    }

    // TODO: Called before map is added
    setIndex = () => {}

    async loadMetaData() {
        const { style = 'Road' } = this.options
        const metaDataUrl = `http://dev.virtualearth.net/REST/V1/Imagery/Metadata/${style}?output=json&include=ImageryProviders&key=${key}`

        return fetchJsonp(metaDataUrl, { jsonpCallback: 'jsonp' })
            .then(response => response.json())
            .then(this.onMetaDataLoad)
            .catch(console.error.bind(console)) // TODO
    }

    onMetaDataLoad = metaData => {
        if (metaData.statusCode !== 200) {
            throw new Error(
                'Bing Imagery Metadata error: \n' +
                    JSON.stringify(metaData, null, '  ')
            )
        }

        const resource = metaData.resourceSets[0].resources[0]
        const { imageUrl, imageryProviders, imageUrlSubdomains } = resource

        return {
            imageUrl,
            imageryProviders,
            imageUrlSubdomains,
        }
    }

    updateAttribution() {}
}

export default BingLayer
