import Layer from './Layer'

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
        const { fillColor } = this.options
        const id = this.getId()

        this.addLayer({
            id,
            type: 'circle',
            source: id,
            paint: {
                'circle-color': [
                    'case',
                    ['has', 'color'],
                    ['get', 'color'],
                    fillColor,
                ],
                'circle-radius': radius,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff',
            },
        })
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
