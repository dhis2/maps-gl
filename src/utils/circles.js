import circle from '@turf/circle'
import { featureCollection } from './geometry'

export const getCirclesSource = (features, radius) => ({
    type: 'geojson',
    data: featureCollection(features.map(feature => circle(feature, radius / 1000))),
})

export const getCirclesLayer = (id, options) => ({
    id: `${id}-buffers`,
    type: 'fill',
    source: `${id}-buffers`,
    paint: {
        'fill-color': '#95c8fb',
        'fill-opacity': 0.1,
        // "fill-outline-color": "#333"
    },
})
