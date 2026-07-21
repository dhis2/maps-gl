import { highlightColorExpr } from './expressions.js'
import { featureCollection } from './geometry.js'

// Only circle/line paint reacts to hover/selected feature-state
// Cloning a fill layer would double-render the same fill
const CLONEABLE_TYPES = new Set(['circle', 'line'])

// Icon layers have no paint property that reacts to feature-state
// Instead we add a colored halo behind a plain clone of the icon
const ICON_HALO_RADIUS = 14
const ICON_HALO_BLUR = 0.6
const ICON_HALO_OPACITY = 0.6

const iconHighlightHalo = layer => ({
    id: `${layer.id}-highlight-halo`,
    type: 'circle',
    // Reuse the base layer's filter
    filter: layer.filter,
    paint: {
        'circle-color': highlightColorExpr('#333333'),
        'circle-radius': ICON_HALO_RADIUS,
        'circle-blur': ICON_HALO_BLUR,
        'circle-opacity': ICON_HALO_OPACITY,
    },
})

// Text labels are also `type: 'symbol'` in maplibre-gl but have no icon-image
const isIconLayer = layer =>
    layer.type === 'symbol' && layer.layout?.['icon-image'] !== undefined

export const getOverlaySourceId = id => `${id}-highlight`

// Creates a small overlay source + cloned layers, drawn above the base
// layers they came from, only ever holds the currently hover/selected features
export const createHighlightOverlay = (map, { id, glLayers, beforeId }) => {
    const mapgl = map.getMapGL()
    const sourceId = getOverlaySourceId(id)

    if (!mapgl.getSource(sourceId)) {
        mapgl.addSource(sourceId, {
            type: 'geojson',
            data: featureCollection(),
        })
    }

    const addOverlayLayer = overlayLayer => {
        if (!mapgl.getLayer(overlayLayer.id)) {
            mapgl.addLayer({ ...overlayLayer, source: sourceId }, beforeId)
        }
        return overlayLayer.id
    }

    return glLayers.flatMap(layer => {
        if (isIconLayer(layer)) {
            // Halo first, so the icon clone renders on top of it
            return [
                addOverlayLayer(iconHighlightHalo(layer)),
                addOverlayLayer({ ...layer, id: `${layer.id}-highlight-icon` }),
            ]
        }

        if (CLONEABLE_TYPES.has(layer.type)) {
            return [addOverlayLayer({ ...layer, id: `${layer.id}-highlight` })]
        }

        return []
    })
}

// Replaces the overlay's contents with `features` and marks them
// hover+selected so the cloned paint renders the highlighted look
export const updateHighlightOverlay = (map, { id, features, color }) => {
    const mapgl = map.getMapGL()
    const sourceId = getOverlaySourceId(id)
    const source = mapgl.getSource(sourceId)

    if (!source) {
        return
    }

    // Re-key to ids local to this source
    const overlayFeatures = features.map((feature, index) => ({
        ...feature,
        id: index + 1,
    }))

    source.setData(featureCollection(overlayFeatures))

    overlayFeatures.forEach(feature =>
        mapgl.setFeatureState(
            { source: sourceId, id: feature.id },
            { hover: true, selected: true, highlightColor: color }
        )
    )
}

export const removeHighlightOverlay = (map, id, overlayLayerIds = []) => {
    const mapgl = map.getMapGL()
    const sourceId = getOverlaySourceId(id)

    if (!mapgl) {
        return
    }

    overlayLayerIds.forEach(layerId => {
        if (mapgl.getLayer(layerId)) {
            mapgl.removeLayer(layerId)
        }
    })

    if (mapgl.getSource(sourceId)) {
        mapgl.removeSource(sourceId)
    }
}
