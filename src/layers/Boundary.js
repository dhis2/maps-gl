import Layer from './Layer'
import { labelLayer } from '../utils/labels'

class Boundary extends Layer {
    constructor(options) {
        super(options)

        console.log('Boundary constructor');

        this.createSource()
        this.createLayers()
    }

    // TODO: Find better way keep style
    setFeatures(data = []) {
        console.log('setFeatures', data, this.options);

        const { radius = 6 } = this.options.style

        this._features = data.map((f, i) => ({
            ...f,
            id: i + 1,
            properties: {
                ...f.properties,
                color: f.properties.style.color,
                weight: f.properties.style.weight,
                radius,
            },
        }))
    }

    createLayers() {
        const id = this.getId()
        const { label, labelStyle } = this.options

        // Line later
        this.addLayer(
            {
                id: `${id}-line`,
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
            this.addLayer(labelLayer({ id, label, ...labelStyle }))
        }
    }
}

export default Boundary
