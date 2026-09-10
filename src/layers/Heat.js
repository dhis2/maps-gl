import {
    setLayersOpacity,
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
        const { heatWeight, heatIntensity, heatColor, heatRadius, opacity } =
            this.options
        const isInteractive = false
        const transformedIntensity = makeHeatmapIntensity(heatIntensity)
        const transformedRadius = makeHeatmapRadius(heatRadius)

        this.addLayer(
            heatLayer({
                id,
                heatWeight,
                heatIntensity: transformedIntensity,
                heatColor,
                heatRadius: transformedRadius,
                opacity,
            }),
            { isInteractive }
        )
    }

    setOpacity(opacity) {
        const mapgl = this.getMapGL()

        if (mapgl) {
            setLayersOpacity(mapgl, this.getId(), opacity)
        }

        this.options.opacity = opacity
    }

    setIntensity(heatIntensity) {
        const mapgl = this.getMapGL()
        const transformedIntensity = makeHeatmapIntensity(heatIntensity)

        if (mapgl) {
            setLayersIntensity(mapgl, this.getId(), transformedIntensity)
        }

        this.options.heatIntensity = transformedIntensity
    }

    setRadius(heatRadius) {
        const mapgl = this.getMapGL()
        const transformedRadius = makeHeatmapRadius(heatRadius)

        if (mapgl) {
            setLayersRadius(mapgl, this.getId(), transformedRadius)
        }

        this.options.heatRadius = heatRadius
    }
}

export default Heat
