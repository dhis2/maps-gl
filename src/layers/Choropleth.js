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
        const { label, labelStyle } = this.options
        
        this.addLayer(polygonLayer({ id }), true)
        this.addLayer(outlineLayer({ id }))
        this.addLayer(pointLayer({ id }), true)

        if (label) {
            this.addLayer(labelLayer({ id, label, ...labelStyle }))
        }
    }
}

export default Choropleth
