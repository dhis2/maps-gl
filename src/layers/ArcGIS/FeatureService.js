import { queryFeatures } from '@esri/arcgis-rest-feature-service'
import { geojsonToArcGIS } from '@terraformer/arcgis'
import ArcGIS from './ArcGIS'
import { polygonLayer } from '../../utils/layers'

class FeatureService extends ArcGIS {
    async addTo(map) {
        this._map = map

        console.log('maps-gl')

        const metadata = await this.getMetadata()
        const { features, properties } = await this.queryFeatures()

        if (properties?.exceededTransferLimit) {
            // Add warning
            console.log('exceededTransferLimit')
        }

        // console.log('metadata', metadata)
        // console.log('features', features)

        this._features = features

        this.createSource()
        this.createLayers()

        map.fitBounds(this.getBounds()) // TODO: Remove

        await super.addTo(map)
    }

    async queryFeatures() {
        const { url, where, geometry } = this.options
        const authentication = this._authentication
        const f = 'geojson'

        console.log('geometry', geometry)

        return queryFeatures({
            url,
            where,
            geometry: geojsonToArcGIS(geometry),
            geometryType: 'esriGeometryPolygon',
            f,
            maxUrlLength: 2048,
            authentication,
        })
    }

    createLayers() {
        const id = this.getId()
        const { style = {} } = this.options
        const { symbol } = this._metadata.drawingInfo.renderer

        // https://developers.arcgis.com/web-map-specification/objects/esriSFS_symbol/
        // const color = this.getColor(symbol.color)
        const color = '#8b0000'

        // console.log('color', color)
        // const { color } = style

        const isInteractive = true

        this.addLayer(polygonLayer({ id, color }), {
            isInteractive,
        })
    }

    getColor([r, g, b, a]) {
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`
    }
}

export default FeatureService
