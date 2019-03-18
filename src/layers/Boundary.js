import Layer from './Layer'

const pointRadius = 5

class Boundary extends Layer {
    constructor(options) {
        super(options)

        const { data } = options
        this.setFeatures(data)
        this.createSource()
        this.createLayers()
    }

    // Flatten properties to access style options
    setFeatures(data) {
        this._features = data.map((f, i) => ({
            ...f,
            id: i,
            properties: {
                ...f.properties,
                ...f.properties.style,
            },
        }))
    }

    createSource() {
        const id = this.getId()
        const features = this.getFeatures()

        this.setSource(id, {
            type: 'geojson',
            data: features,
        })
    }

    createLayers() {
        const id = this.getId()
        const { style = {} } = this.options

        // Polygon layer
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
                    'circle-opacity': 0,
                    'circle-radius': style.radius || pointRadius,
                    'circle-stroke-width': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        ['+', ['get', 'weight'], 2],
                        ['get', 'weight'],
                    ],
                    'circle-stroke-color': ['get', 'color'],
                },
                filter: ['==', '$type', 'Point'],
            },
            true
        )
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
