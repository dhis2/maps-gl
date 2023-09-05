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
