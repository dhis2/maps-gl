import circle from '@turf/circle'

export const getCirclesSource = (features, radius) => ({
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: features.map(feature => circle(feature, radius / 1000)),
    },
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
