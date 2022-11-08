import GeoJson from './GeoJson'
import { polygonLayer } from '../utils/layers'

class GeoJsonUrl extends GeoJson {
    createSource() {
        const id = this.getId()
        const { url } = this.options

        this.setSource(id, {
            type: 'geojson',
            data: url,
        })
    }

    createLayers() {
        const id = this.getId()
        const { style = {} } = this.options
        const { color } = style

        this.addLayer(polygonLayer({ id, color }))
    }
}

export default GeoJsonUrl
