import Layer from './Layer'

// TODO: https://github.com/dhis2/maps-gl/blob/layer-handling/src/layers/ClientCluster.js
class ClientCluster extends Layer {
    constructor(options) {
        super(options)

        const { data, fillColor, radius } = options
        this.setFeatures(data)
        this.createSource()
        this.createLayers(fillColor, radius)
    }

    createSource() {
        const id = this.getId()
        const features = this.getFeatures()

        this.setSource(id, {
            type: 'geojson',
            data: features,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
        })
    }

    createLayers(color, radius) {
        const id = this.getId()

        this.addLayer({
            id: `${id}-clusters`,
            type: 'circle',
            source: id,
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': color,
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    15,
                    10,
                    20,
                    1000,
                    25,
                    10000,
                    30,
                ],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff',
            },
        })

        this.addLayer({
            id: `${id}-count`,
            type: 'symbol',
            source: id,
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold'],
                'text-size': 16,
            },
            paint: {
                'text-color': '#fff',
            },
        })

        this.addLayer({
            id,
            type: 'circle',
            source: id,
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': color, // ['get', 'color'],
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
            mapgl.setPaintProperty(`${id}-clusters`, 'circle-opacity', opacity)
            mapgl.setPaintProperty(
                `${id}-clusters`,
                'circle-stroke-opacity',
                opacity
            )
            mapgl.setPaintProperty(`${id}-count`, 'text-opacity', opacity)
        }
    }
}

export default ClientCluster
