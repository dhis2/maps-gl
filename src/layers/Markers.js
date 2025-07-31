import { bufferLayer, bufferOutlineLayer } from '../utils/buffers.js'
import { labelLayer } from '../utils/labels.js'
import { symbolLayer } from '../utils/layers.js'
import Layer from './Layer.js'

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
        const isInteractive = true

        if (buffer) {
            this.addLayer(bufferLayer({ id, ...bufferStyle }))
            this.addLayer(bufferOutlineLayer({ id, ...bufferStyle }))
        }

        this.addLayer(symbolLayer({ id }), { isInteractive })

        if (label) {
            this.addLayer(labelLayer({ id, label, ...labelStyle }))
        }
    }
}

export default Markers
