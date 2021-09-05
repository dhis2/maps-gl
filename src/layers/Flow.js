import Layer from './Layer'
import { MapboxLayer, ArcLayer } from 'deck.gl'

class Flow extends Layer {
    constructor(options) {
        super(options)
        this.createLayer()
    }

    createLayer() {
        console.log('Create layer')

        const layer = new MapboxLayer({
            id: 'deckgl-arc',
            type: ArcLayer,
            data: [
                {
                    source: [-122.3998664, 37.7883697],
                    target: [-122.400068, 37.7900503],
                },
            ],
            getSourcePosition: d => d.source,
            getTargetPosition: d => d.target,
            getSourceColor: [255, 208, 0],
            getTargetColor: [0, 128, 255],
            getWidth: 8,
        })

        this.addLayer(layer)
    }
}

export default Flow
