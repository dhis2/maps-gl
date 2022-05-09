import Layer from './Layer'
import { outlineLayer } from '../utils/layers'

class VectorTile extends Layer {
    constructor(options) {
        super(options)
        this.createSource()
        this.createLayer()
    }

    createSource() {
        this.setSource(this.getId(), {
            type: 'vector',
            tiles: [this.options.source],
        })
    }

    createLayer() {
        const id = this.getId()
        const { style = {} } = this.options
        const { strokeColor, weight: width } = style

        this.addLayer(
            outlineLayer({
                id,
                sourceLayer: 'organisationunit',
                color: strokeColor,
                width,
            })
        )
    }
}

export default VectorTile
