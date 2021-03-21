import Layer from './Layer'
import { bufferLayer, bufferOutlineLayer } from '../utils/buffers'
import { addTextProperties } from '../utils/labels'

class Markers extends Layer {
    constructor(options) {
        super(options)

        this.setImages()
        this.createSource()
        this.createLayer()
    }

    setImages() {
        const features = this.getFeatures()
        const images = {}

        features.forEach(f => {
            images[f.properties.icon.iconUrl] = f.properties.icon.iconSize
            f.properties.iconUrl = f.properties.icon.iconUrl
        })

        this._images = Object.keys(images)
    }

    createLayer() {
        const id = this.getId()
        const { buffer, bufferStyle, label, labelStyle } = this.options

        if (buffer) {
            this.addLayer(bufferLayer({ id, ...bufferStyle }))
            this.addLayer(bufferOutlineLayer({ id, ...bufferStyle }))
        }

        const config = {
            id: `${id}-icon`,
            type: 'symbol',
            source: id,
            layout: {
                'icon-image': ['get', 'iconUrl'],
                'icon-size': 1,
                'icon-allow-overlap': true,
            },
        }

        this.addLayer(
            label ? addTextProperties(config, label, labelStyle) : config,
            true
        )
    }
}

export default Markers
