import { queryFeatures } from '@esri/arcgis-rest-feature-service'
import ArcGIS from './ArcGIS'

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

        this._features = features

        console.log('metadata', metadata)
        console.log('features', features)
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
}

export default FeatureService
