import { labelLayer } from '../utils/labels.js'
import { pointLayer, polygonLayer, outlineLayer } from '../utils/layers.js'
import Layer from './Layer.js'

class Choropleth extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    createLayers() {
        const id = this.getId()
        const { color, opacity, label, labelStyle } = this.options
        const isInteractive = true

        this.addLayer(polygonLayer({ id, color, opacity }), { isInteractive })
        this.addLayer(outlineLayer({ id, opacity }))
        this.addLayer(pointLayer({ id, color, opacity }), { isInteractive })

        if (label) {
            this.addLayer(labelLayer({ id, label, ...labelStyle, opacity }))
        }
    }
}

export default Choropleth
