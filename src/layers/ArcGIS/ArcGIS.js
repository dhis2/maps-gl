import { ApiKeyManager, request } from '@esri/arcgis-rest-request'
import Layer from '../Layer'

class ArcGIS extends Layer {
    constructor(options) {
        super(options)
        this.authenticate()
        // this.getMetadata()
    }

    authenticate() {
        const { apiKey } = this.options

        if (apiKey) {
            this._authentication = ApiKeyManager.fromKey(apiKey)
        }
    }

    async getMetadata() {
        const { url } = this.options
        const authentication = this._authentication

        if (url) {
            this._metadata = await request(url, { authentication })
        }

        return this._metadata
    }
}

export default ArcGIS
