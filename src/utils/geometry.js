import { LngLatBounds } from 'mapbox-gl'

export const getBoundsFromLayers = layers => {
    const bounds = new LngLatBounds()

    layers.forEach(layer => {
        const layerBounds = layer.getBounds()

        if (layerBounds) {
            bounds.extend(layerBounds)
        }
    })

    return bounds.isEmpty() ? null : bounds.toArray()
}
