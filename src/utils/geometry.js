import { LngLatBounds } from 'maplibre-gl'

export const isPoint = feature => feature.geometry.type === 'Point'

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
