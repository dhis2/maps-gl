import Layer from './Layer'
import { heatLayer } from '../utils/layers'

class Heat extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    createLayers() {
        const id = this.getId()
        const isInteractive = false

        this.addLayer(heatLayer({ id }), { isInteractive })
    }
}

export default Heat
