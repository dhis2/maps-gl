import Layer from './Layer'
import { pointLayer, polygonLayer, outlineLayer } from '../utils/layers'
import { bufferLayer, bufferOutlineLayer } from '../utils/buffers'
import { eventStrokeColor } from '../utils/style'

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

        if (buffer) {
            this.addLayer(bufferLayer({ id, ...bufferStyle }))
            this.addLayer(bufferOutlineLayer({ id, ...bufferStyle }))
        }

        this.addLayer(pointLayer({ id, color, radius, strokeColor }), true)
        this.addLayer(polygonLayer({ id, color }), true)
        this.addLayer(outlineLayer({ id, color: strokeColor }))
    }
}

export default Events
