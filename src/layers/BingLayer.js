import fetchJsonp from 'fetch-jsonp'
import Layer from './Layer'
import { bboxIntersect } from '../utils/geo'
import './BingLayer.css'

// https://docs.microsoft.com/en-us/bingmaps/rest-services/directly-accessing-the-bing-maps-tiles
class BingLayer extends Layer {
    async createSource() {
        const { imageUrl, imageUrlSubdomains, imageryProviders } =
            await this.loadMetaData()

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
        const id = this.getId()

        this.addLayer({
            id: `${id}-raster`,
            type: 'raster',
            source: id,
        })
    }

    async addTo(map) {
        await this.createSource()

        this.createLayer()

        await super.addTo(map)

        // Make sure overlays are on top
        map.orderOverlays()

        this.getMapGL().on('moveend', this.updateAttribution)

        this.updateAttribution()
        this.addBingMapsLogo()

        if (this.options.opacity !== undefined) {
            this.setOpacity(this.options.opacity)
        }
    }

    onRemove() {
        const mapgl = this.getMapGL()

        if (mapgl) {
            mapgl.off('moveend', this.updateAttribution)

            if (this._brandLogoImg) {
                const container = mapgl.getContainer()

                container.removeChild(this._brandLogoImg)
                container.classList.remove('dhis2-map-bing')
            }
        }
    }

    async loadMetaData() {
        const { apiKey, style = 'Road' } = this.options

        // https://docs.microsoft.com/en-us/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes
        const culture = 'en-GB'

        // https://docs.microsoft.com/en-us/bingmaps/rest-services/imagery/get-imagery-metadata
        const metaDataUrl = `https://dev.virtualearth.net/REST/V1/Imagery/Metadata/${style}?output=json&include=ImageryProviders&culture=${culture}&key=${apiKey}&uriScheme=https`

        return fetchJsonp(metaDataUrl, { jsonpCallback: 'jsonp' })
            .then(response => response.json())
            .then(this.onMetaDataLoad)
    }

    onMetaDataLoad = metaData => {
        if (metaData.statusCode !== 200) {
            throw new Error(
                'Bing Imagery Metadata error: \n' +
                    JSON.stringify(metaData, null, '  ')
            )
        }

        return metaData.resourceSets[0].resources[0]
    }

    addBingMapsLogo() {
        const container = this.getMap().getContainer()
        const div = document.createElement('div')

        div.className = 'dhis2-map-bing-logo'

        container.appendChild(div)
        container.classList.add('dhis2-map-bing')

        this._brandLogoImg = div
    }

    getAttribution() {
        const mapgl = this.getMapGL()
        const [lngLat1, lngLat2] = mapgl.getBounds().toArray()
        const mapBbox = [...lngLat1.reverse(), ...lngLat2.reverse()]
        const mapZoom = mapgl.getZoom() < 1 ? 1 : mapgl.getZoom()

        // TODO: boxIntersect or bboxOverlaps?
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

        if (source) {
            source.attribution = this.getAttribution()
            this.getMap()._updateAttributions()
        }
    }
}

export default BingLayer
