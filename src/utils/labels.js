import area from '@turf/area'
import polylabel from 'polylabel'
import { featureCollection } from './geometry'

// Default fonts
const fonts = {
    'normal-normal': 'Open Sans Regular',
    'normal-bold': 'Open Sans Bold',
    'italic-normal': 'Open Sans Italic',
    'italic-bold': 'Open Sans Bold Italic',
}

// Returns offset in ems
const getOffsetEms = (type, radius = 5, fontSize = 11) =>
    type === 'Point' ? radius / parseInt(fontSize, 10) + 0.4 : 0

export const labelSource = (features, { fontSize }, isBoundary) => ({
    type: 'geojson',
    data: featureCollection(
        features.map(({ geometry, properties }) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: getLabelPosition(geometry),
            },
            properties: {
                name: properties.name,
                anchor: geometry.type === 'Point' ? 'top' : 'center',
                offset: [
                    0,
                    getOffsetEms(geometry.type, properties.radius, fontSize),
                ],
                color: isBoundary ? properties.color : '#333',
                value: properties.value,
            },
        }))
    ),
})

export const labelLayer = ({
    id,
    label,
    fontSize,
    fontStyle,
    fontWeight,
    color,
}) => {
    const font = `${fontStyle || 'normal'}-${fontWeight || 'normal'}`
    const size = fontSize ? parseInt(fontSize, 10) : 12

    return {
        type: 'symbol',
        id: `${id}-label`,
        source: `${id}-label`,
        layout: {
            'text-field': label || '{name}',
            'text-font': [fonts[font]],
            'text-size': size,
            'text-anchor': ['get', 'anchor'],
            'text-offset': ['get', 'offset'],
        },
        paint: {
            'text-color': color ? color : ['get', 'color'],
        },
    }
}

export const getLabelPosition = ({ type, coordinates }) => {
    if (type === 'Point') {
        return coordinates
    }

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
