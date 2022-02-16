import Layer from './Layer'
import { pointLayer, polygonLayer, outlineLayer } from '../utils/layers'
import { labelLayer } from '../utils/labels'

class Choropleth extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    createLayers() {
        const id = this.getId()
        const { color, label, labelStyle } = this.options
        const isInteractive = true

        this.addLayer(polygonLayer({ id, color }), { isInteractive })
        this.addLayer(outlineLayer({ id }))
        this.addLayer(pointLayer({ id, color }), { isInteractive })

        if (label) {
            this.addLayer(labelLayer({ id, label, ...labelStyle }))
        }
    }
}

export default Choropleth
