import { queryFeatures } from '@esri/arcgis-rest-feature-service'
import ArcGIS from './ArcGIS'
import { polygonLayer } from '../../utils/layers'

class FeatureService extends ArcGIS {
    async addTo(map) {
        this._map = map

        const metadata = await this.getMetadata()
        const { features, properties } = await this.queryFeatures()
        const { exceededTransferLimit } = properties

        if (exceededTransferLimit) {
            // Add warning
            console.log('exceededTransferLimit')
        }

        console.log('metadata', metadata)
        // console.log('features', features)

        this._features = features

        this.createSource()
        this.createLayers()

        map.fitBounds(this.getBounds()) // TODO: Remove

        await super.addTo(map)
    }

    async queryFeatures() {
        const { url, where } = this.options
        const authentication = this._authentication
        const f = 'geojson'

        return queryFeatures({
            url,
            where,
            f,
            authentication,
        })
    }

    createLayers() {
        const id = this.getId()
        const { style = {} } = this.options
        const { symbol } = this._metadata.drawingInfo.renderer
        // const { color } = symbol

        // console.log('color', color)

        const { color } = style

        const isInteractive = true

        this.addLayer(polygonLayer({ id, color }), {
            isInteractive,
        })
    }
}

export default FeatureService
