import Layer from './Layer'
import { getLablesSource, getLabelsLayer } from '../utils/labels'

const borderColor = '#333'
const borderWeight = 1
const hoverBorderWeight = 3

class Boundary extends Layer {
    constructor(options) {
        super(options)

        const { data } = options
        this.setFeatures(data)
        this.createSource()
        this.createLayers()
    }

    // TODO: Find better way keep style
    setFeatures(data = []) {
        const { radius = 5 } = this.options.style

        this._features = data.map((f, i) => ({
            ...f,
            id: i,
            properties: {
                ...f.properties,
                color: f.properties.style.color,
                weight: f.properties.style.weight,
                radius,
            },
        }))
    }

    createSource() {
        const id = this.getId()
        const features = this.getFeatures()
        const { label, labelStyle } = this.options

        this.setSource(id, {
            type: 'geojson',
            data: features,
        })

        if (label) {
            this.setSource(
                `${id}-labels`,
                getLablesSource(features, labelStyle, true)
            )
        }
    }

    createLayers() {
        const id = this.getId()
        const { label, labelStyle } = this.options

        // Line later
        this.addLayer(
            {
                id,
                type: 'line',
                source: id,
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        ['+', ['get', 'weight'], 2],
                        ['get', 'weight'],
                    ],
                },
                filter: ['==', '$type', 'Polygon'],
            },
            true
        )

        // Point layer
        this.addLayer(
            {
                id: `${id}-point`,
                type: 'circle',
                source: id,
                paint: {
                    'circle-color': 'transparent',
                    'circle-radius': ['get', 'radius'],
                    'circle-stroke-color': ['get', 'color'],
                    'circle-stroke-width': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        ['+', ['get', 'weight'], 2],
                        ['get', 'weight'],
                    ],
                },
                filter: ['==', '$type', 'Point'],
            },
            true
        )

        if (label) {
            this.addLayer(getLabelsLayer(id, label, labelStyle))
        }
    }

    setOpacity(opacity) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(id, 'line-opacity', opacity)
        }
    }
}

export default Boundary
