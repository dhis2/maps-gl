import Layer from './Layer'
import { symbolLayer } from '../utils/layers'
import { bufferLayer, bufferOutlineLayer } from '../utils/buffers'
import { labelLayer } from '../utils/labels'

class Markers extends Layer {
    constructor(options) {
        super(options)

        this.setImages()
        this.createSource()
        this.createLayer()
    }

    createLayer() {
        const id = this.getId()
        const { buffer, bufferStyle, label, labelStyle } = this.options

        if (buffer) {
            this.addLayer(bufferLayer({ id, ...bufferStyle }))
            this.addLayer(bufferOutlineLayer({ id, ...bufferStyle }))
        }

        this.addLayer(symbolLayer({ id }), true)

        if (label) {
            this.addLayer(labelLayer({ id, label, ...labelStyle }))
        }
    }
}

export default Markers
