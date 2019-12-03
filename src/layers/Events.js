import Layer from './Layer'

const strokeColor = '#fff'
const strokeWeight = 1
const hoverStrokeWeight = 3

class Events extends Layer {
    constructor(options) {
        super(options)

        const { data, radius } = options
        this.setFeatures(data)
        this.createSource()
        this.createLayers(radius)
    }

    createSource() {
        const id = this.getId()
        const features = this.getFeatures()

        this.setSource(id, {
            type: 'geojson',
            data: features,
        })
    }

    createLayers(radius) {
        const id = this.getId()

        this.addLayer(
            {
                id,
                type: 'circle',
                source: id,
                paint: {
                    'circle-color': ['get', 'color'],
                    'circle-radius': radius,
                    'circle-stroke-width': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        hoverStrokeWeight,
                        strokeWeight,
                    ],
                    'circle-stroke-color': strokeColor,
                },
            },
            true
        )
    }

    setOpacity(opacity) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(id, 'circle-opacity', opacity)
            mapgl.setPaintProperty(id, 'circle-stroke-opacity', opacity)
        }
    }
}

export default Events
