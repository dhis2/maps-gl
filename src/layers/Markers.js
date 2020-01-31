import Layer from './Layer'
import { getCirclesSource, getCirclesLayer } from '../utils/circles'
import { addTextProperties } from '../utils/labels'

class Markers extends Layer {
    constructor(options) {
        super(options)
        const { data } = options

        this.setFeatures(data)
        this.setImages()
        this.createSource()
        this.createLayer()
    }

    setImages() {
        const data = this.getFeatures()
        const images = {}

        data.features.forEach(f => {
            images[f.properties.icon.iconUrl] = f.properties.icon.iconSize
            f.properties.iconUrl = f.properties.icon.iconUrl
        })

        this._images = Object.keys(images)
    }

    createSource() {
        const id = this.getId()
        const data = this.getFeatures()
        const { buffer } = this.options

        this.setSource(id, {
            type: 'geojson',
            data,
        })

        if (buffer) {
            this.setSource(
                `${id}-buffers`,
                getCirclesSource(data.features, buffer)
            )
        }
    }

    createLayer() {
        const id = this.getId()
        const { buffer, bufferStyle, label, labelStyle } = this.options

        if (buffer) {
            this.addLayer(getCirclesLayer(id, bufferStyle))
        }

        const config = {
            id,
            type: 'symbol',
            source: id,
            layout: {
                'icon-image': ['get', 'iconUrl'],
                'icon-size': 1,
                'icon-allow-overlap': true,
            },
        }

        if (label) {
            addTextProperties(config, label, labelStyle)
        }

        this.addLayer(config, true)
    }

    setOpacity(opacity) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(id, 'icon-opacity', opacity)
        }
    }
}

export default Markers
