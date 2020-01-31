import area from '@turf/area'
import polylabel from 'polylabel'

// TODO: Sould we host the fonts ourselves?
// https://github.com/openmaptiles/fonts
// https://github.com/openmaptiles/fonts/blob/gh-pages/fontstacks.json
const fonts = {
    'normal-normal': 'Open Sans Regular',
    'normal-bold': 'Open Sans Bold',
    'italic-normal': 'Open Sans Italic',
    'italic-bold': 'Open Sans Bold Italic',
}

export const getLablesSource = data => ({
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: data.features.map(({ geometry, properties }) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: getLabelPosition(geometry),
            },
            properties: {
                name: properties.name,
            },
        })),
    },
})

// Add label properties to layer config
export const addTextProperties = (config, label, style) => {
    const { fontSize, fontStyle, fontWeight, color } = style
    const font = `${fontStyle || 'normal'}-${fontWeight || 'normal'}`
    const size = fontSize ? parseInt(fontSize, 10) : 12

    return {
        ...config,
        layout: {
            ...config.layout,
            'text-field': label || '{name}',
            'text-font': [fonts[font]],
            'text-size': size,
            'text-optional': true,
        },
        paint: {
            ...config.paint,
            'text-color': color || '#333',
            'text-translate': [0, 20],
        },
    }

    return config
}

export const getLabelsLayer = (id, label, style) => {
    const { fontSize, fontStyle, fontWeight, color } = style
    const font = `${fontStyle || 'normal'}-${fontWeight || 'normal'}`
    const size = fontSize ? parseInt(fontSize, 10) : 12

    return {
        type: 'symbol',
        id: `${id}-labels`,
        source: `${id}-labels`,
        layout: {
            'text-field': label || '{name}',
            'text-font': [fonts[font]],
            'text-size': size,
        },
        paint: {
            'text-color': color || '#333',
        },
    }
}

export const getLabelPosition = ({ type, coordinates }) => {
    let polygon = coordinates

    if (type === 'MultiPolygon') {
        const areas = coordinates.map(coords =>
            area({
                type: 'Polygon',
                coordinates: coords,
            })
        )
        const maxIndex = areas.indexOf(Math.max.apply(null, areas))
        polygon = coordinates[maxIndex]
    }

    return polylabel(polygon, 0.1)
}
