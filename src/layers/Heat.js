import {
    makeHeatmapIntensity,
    setLayersIntensity,
    makeHeatmapRadius,
    setLayersRadius,
} from '../utils/heat.js'
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
            heatLayer({
                id,
                weight,
                intensity: makeHeatmapIntensity(intensity),
                color,
                radius: makeHeatmapRadius(radius),
                opacity,
            }),
            { isInteractive }
        )
    }

    setIntensity(intensity) {
        const mapgl = this.getMapGL()

        if (mapgl) {
            setLayersIntensity(
                mapgl,
                this.getId(),
                makeHeatmapIntensity(intensity)
            )
        }

        this.options.intensity = intensity
    }

    setRadius(radius) {
        const mapgl = this.getMapGL()

        if (mapgl) {
            setLayersRadius(mapgl, this.getId(), makeHeatmapRadius(radius))
        }

        this.options.radius = radius
    }
}

export default Heat
