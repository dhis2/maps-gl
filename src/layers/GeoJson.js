import Layer from './Layer'
import { pointLayer, lineLayer, polygonLayer, outlineLayer } from '../utils/layers'
import { bufferLayer, bufferOutlineLayer } from '../utils/buffers'

class GeoJson extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    createLayers() {
        const id = this.getId()
        const { style = {}, buffer, bufferStyle } = this.options
        const { radius, color, weight } = style  

        if (buffer) {
            this.addLayer(bufferLayer({ id, ...bufferStyle }))
            this.addLayer(bufferOutlineLayer({ id, ...bufferStyle }))
        }

        this.addLayer(polygonLayer({ id,color }), true)
        this.addLayer(outlineLayer({ id, color}))
        this.addLayer(lineLayer({ id, color, weight }), true)
        this.addLayer(pointLayer({ id, color, radius }), true)
    }
}

export default GeoJson
