import Layer from './Layer'
import {
    pointLayer,
    lineLayer,
    polygonLayer,
    outlineLayer,
} from '../utils/layers'
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
        const { radius, color, weight: width } = style

        if (buffer) {
            this.addLayer(bufferLayer({ id, ...bufferStyle }))
            this.addLayer(bufferOutlineLayer({ id, ...bufferStyle }))
        }

        console.log('color', color)

        this.addLayer(polygonLayer({ id, color }), true)
        this.addLayer(outlineLayer({ id, color, width }))
        this.addLayer(lineLayer({ id, color, width }), true)
        this.addLayer(pointLayer({ id, color, width, radius }), true)
    }
}

export default GeoJson
