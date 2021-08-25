import Layer from './Layer'
import {
    pointLayer,
    lineLayer,
    polygonLayer,
    outlineLayer,
    symbolLayer,
} from '../utils/layers'
import { bufferLayer, bufferOutlineLayer } from '../utils/buffers'
import { labelLayer } from '../utils/labels'

class GeoJson extends Layer {
    constructor(options) {
        super(options)

        this.setImages()
        this.createSource()
        this.createLayers()
    }

    createLayers() {
        const id = this.getId()
        const {
            style = {},
            buffer,
            bufferStyle,
            label,
            labelStyle,
        } = this.options
        const { radius, color, strokeColor, weight: width } = style

        if (buffer) {
            this.addLayer(bufferLayer({ id, ...bufferStyle }))
            this.addLayer(bufferOutlineLayer({ id, ...bufferStyle }))
        }

        this.addLayer(polygonLayer({ id, color }), true)
        this.addLayer(outlineLayer({ id, color: strokeColor, width }))
        this.addLayer(lineLayer({ id, color, width }), true)
        this.addLayer(
            pointLayer({ id, color, strokeColor, width, radius }),
            true
        )
        this.addLayer(symbolLayer({ id }), true)

        if (label) {
            this.addLayer(labelLayer({ id, label, ...labelStyle }))
        }
    }
}

export default GeoJson
