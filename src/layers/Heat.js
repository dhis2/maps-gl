import { heatLayer } from '../utils/layers.js'
import Layer from './Layer.js'

class Heat extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    createLayers() {
        const id = this.getId()
        const { weight, intensity, color, radius, opacity } = this.options
        const isInteractive = false

        this.addLayer(
            heatLayer({ id, weight, intensity, color, radius, opacity }),
            { isInteractive }
        )
    }
}

export default Heat
