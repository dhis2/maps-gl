import { bufferLayer, bufferOutlineLayer } from '../utils/buffers.js'
import { labelLayer } from '../utils/labels.js'
import {
    pointLayer,
    lineLayer,
    polygonLayer,
    outlineLayer,
    symbolLayer,
} from '../utils/layers.js'
import Layer from './Layer.js'

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

        const {
            radius,
            color,
            strokeColor,
            weight: width,
            opacityFactor,
        } = style

        const isInteractive = true

        if (buffer) {
            this.addLayer(bufferLayer({ id, ...bufferStyle }))
            this.addLayer(bufferOutlineLayer({ id, ...bufferStyle }))
        }

        this.addLayer(polygonLayer({ id, color }), {
            isInteractive,
            opacityFactor,
        })
        this.addLayer(outlineLayer({ id, color: strokeColor, width }))
        this.addLayer(lineLayer({ id, color: strokeColor || color, width }), {
            isInteractive,
        })
        this.addLayer(pointLayer({ id, color, strokeColor, width, radius }), {
            isInteractive,
        })
        this.addLayer(symbolLayer({ id }), { isInteractive })

        if (label) {
            this.addLayer(labelLayer({ id, label, ...labelStyle }))
        }
    }
}

export default GeoJson
