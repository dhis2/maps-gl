import Layer from './Layer'
import { getLablesSource, getLabelsLayer } from '../utils/labels'

const borderColor = '#333'
const borderWeight = 1
const hoverBorderWeight = 3

class Choropleth extends Layer {
    constructor(options) {
        super(options)

        const { data } = options

        this.setFeatures(data)
        this.createSource()
        this.createLayers()
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
                getLablesSource(features, labelStyle)
            )
        }
    }

    createLayers() {
        const id = this.getId()
        const { label, labelStyle } = this.options

        // Polygon layer
        this.addLayer(
            {
                id: `${id}`,
                type: 'fill',
                source: id,
                paint: {
                    'fill-color': ['get', 'color'],
                },
                filter: ['==', '$type', 'Polygon'],
            },
            true
        )

        // Polygon outline and hover state
        // https://github.com/mapbox/mapbox-gl-js/issues/3018
        this.addLayer({
            id: `${id}-outline`,
            type: 'line',
            source: id,
            paint: {
                'line-color': borderColor,
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    hoverBorderWeight,
                    borderWeight,
                ],
            },
            filter: ['==', '$type', 'Polygon'],
        })

        // Point layer
        this.addLayer(
            {
                id: `${id}-point`,
                type: 'circle',
                source: id,
                paint: {
                    'circle-color': ['get', 'color'],
                    'circle-radius': ['get', 'radius'],
                    'circle-stroke-width': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        hoverBorderWeight,
                        borderWeight,
                    ],
                    'circle-stroke-color': borderColor,
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
            const { label } = this.options

            mapgl.setPaintProperty(id, 'fill-opacity', opacity)
            mapgl.setPaintProperty(`${id}-outline`, 'line-opacity', opacity)
            mapgl.setPaintProperty(`${id}-point`, 'circle-opacity', opacity)
            mapgl.setPaintProperty(
                `${id}-point`,
                'circle-stroke-opacity',
                opacity
            )

            if (label) {
                mapgl.setPaintProperty(`${id}-labels`, 'text-opacity', opacity)
            }
        }
    }
}

export default Choropleth
