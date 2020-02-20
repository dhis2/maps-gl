import Layer from './Layer'
import { pointLayer, lineLayer, polygonLayer, outlineLayer } from '../utils/layers'

class GeoJson extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    createLayers() {
        const id = this.getId()
        const { radius, color, weight } = this.options.style || {}   

        this.addLayer(polygonLayer({ id,color }), true)
        this.addLayer(outlineLayer({ id, color}))
        this.addLayer(lineLayer({ id, color, weight }), true)
        this.addLayer(pointLayer({ id, color, radius }), true)
    }
}

export default GeoJson
