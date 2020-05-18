import { LngLatBounds } from 'mapbox-gl'
import area from '@turf/area'
import polylabel from 'polylabel'

export const getBoundsFromLayers = (layers = []) => {
    const bounds = layers.reduce((b, l) => {
        if (l.getBounds) {
            const layerBounds = l.getBounds()

            if (layerBounds) {
                return b.extend(layerBounds)
            }
        }

        return b
    }, new LngLatBounds())

    return bounds.isEmpty() ? null : bounds.toArray()
}

export const featureCollection = (features = []) => ({
    type: 'FeatureCollection',
    features,
})

export const poleOfInaccessibility = ({ type, coordinates }) => {
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
