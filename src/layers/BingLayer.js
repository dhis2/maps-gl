import fetchJsonp from 'fetch-jsonp'
import Layer from './Layer'
import { bboxIntersect } from '../utils/geo'

// http://dev.virtualearth.net/REST/V1/Imagery/Metadata/Road?output=json&include=ImageryProviders&key=BingMapsKey
// https://docs.microsoft.com/en-us/bingmaps/rest-services/directly-accessing-the-bing-maps-tiles
// https://github.com/mapbox/mapbox-gl-js/issues/4137
// https://github.com/mapbox/mapbox-gl-native/issues/4653
// https://github.com/digidem/leaflet-bing-layer
// https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.md
class BingLayer extends Layer {
    async createSource() {
        const {
            imageUrl,
            imageUrlSubdomains,
            imageryProviders,
            brandLogoUri,
        } = await this.loadMetaData()

        this._brandLogoUri = brandLogoUri
        this._imageryProviders = imageryProviders

        this.setSource(this.getId(), {
            type: 'raster',
            tiles: imageUrlSubdomains.map(
                subdomain => imageUrl.replace('{subdomain}', subdomain) //  + '&dpi=d2&device=mobile' // TODO
            ),
            tileSize: 256, // default is 512
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

        this.getMapGL().on('moveend', this.updateAttribution)
        this.updateAttribution()
        this.addBingMapsLogo()
    }

    onRemove() {
        const mapgl = this.getMapGL()

        mapgl.off('moveend', this.updateAttribution)

        if (this._brandLogoImg) {
            mapgl.getContainer().removeChild(this._brandLogoImg)
        }
    }

    async loadMetaData() {
        const { apiKey, style = 'Road' } = this.options

        // https://docs.microsoft.com/en-us/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes
        const culture = 'en-GB'

        // https://docs.microsoft.com/en-us/bingmaps/rest-services/imagery/get-imagery-metadata
        const metaDataUrl = `http://dev.virtualearth.net/REST/V1/Imagery/Metadata/${style}?output=json&include=ImageryProviders&culture=${culture}&key=${apiKey}`

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

        const { brandLogoUri, resourceSets } = metaData

        return {
            brandLogoUri,
            ...resourceSets[0].resources[0],
        }
    }

    addBingMapsLogo() {
        const container = this.getMap().getContainer()
        const img = document.createElement('img')

        img.src = this._brandLogoUri
        img.className = 'bing-maps-logo'

        container.appendChild(img)

        this._brandLogoImg = img
    }

    getAttribution() {
        const mapgl = this.getMapGL()
        const [lngLat1, lngLat2] = mapgl.getBounds().toArray()
        const mapBbox = [...lngLat1.reverse(), ...lngLat2.reverse()]
        const mapZoom = mapgl.getZoom() < 1 ? 1 : mapgl.getZoom()

        const providers = this._imageryProviders.filter(({ coverageAreas }) =>
            coverageAreas.some(
                ({ bbox, zoomMin, zoomMax }) =>
                    bboxIntersect(bbox, mapBbox) &&
                    mapZoom >= zoomMin &&
                    mapZoom <= zoomMax
            )
        )

        return providers.map(p => p.attribution).join(', ')
    }

    updateAttribution = () => {
        const source = this.getMapGL().getSource(this.getId())

        source.attribution = this.getAttribution()

        this.getMap()._updateAttributions()
    }
}

export default BingLayer
