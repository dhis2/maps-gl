import Layer from './Layer'
import { pointLayer, polygonLayer, outlineLayer } from '../utils/layers'

class Events extends Layer {
    constructor(options) {
        super(options)

        const { data, fillColor, radius } = options

        this.setFeatures(data)
        this.createSource()
        this.createLayers(fillColor, radius)
    }

    createLayers(color, radius) {
        const id = this.getId()

        this.addLayer(pointLayer({ id, color, radius }), true)
        this.addLayer(polygonLayer({ id, color }), true)
        this.addLayer(outlineLayer({ id }))
    }
}

export default Events
