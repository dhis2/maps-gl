import { bufferLayer, bufferOutlineLayer } from '../utils/buffers.js'
import { pointLayer, polygonLayer, outlineLayer } from '../utils/layers.js'
import { eventStrokeColor } from '../utils/style.js'
import Layer from './Layer.js'

class Events extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    createLayers() {
        const id = this.getId()
        const {
            fillColor: color,
            strokeColor = eventStrokeColor,
            radius,
            buffer,
            bufferStyle,
        } = this.options
        const isInteractive = true

        if (buffer) {
            this.addLayer(bufferLayer({ id, ...bufferStyle }))
            this.addLayer(bufferOutlineLayer({ id, ...bufferStyle }))
        }

        this.addLayer(pointLayer({ id, color, radius, strokeColor }), {
            isInteractive,
        })
        this.addLayer(polygonLayer({ id, color }), { isInteractive })
        this.addLayer(outlineLayer({ id, color: strokeColor }))
    }
}

export default Events
