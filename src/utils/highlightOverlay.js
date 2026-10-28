import { featureCollection } from './geometry.js'
import { iconHaloOpacity } from './style.js'

// Fill paint ignores hover, and a cloned fill would render twice
const CLONEABLE_TYPES = new Set(['circle', 'line'])

// Paint property that takes the highlight color, per cloned layer type
const COLOR_PROPERTY = { circle: 'circle-stroke-color', line: 'line-color' }

// Icon paint ignores hover, so a colored halo goes behind an icon clone
const ICON_HALO_RADIUS = 14
const ICON_HALO_BLUR = 0.6
const ICON_HALO_COLOR = '#333333'

// WeakMap so mapgl instances are not prevented from being GC'd
const _overlays = new WeakMap()

const getOverlays = mapgl => {
    if (!_overlays.has(mapgl)) {
        _overlays.set(mapgl, new Map())
    }
    return _overlays.get(mapgl)
}

const resolveHover = value => {
    if (!Array.isArray(value)) {
        return value
    }
    if (value[0] === 'feature-state' && value[1] === 'hover') {
        return true
    }
    return value.map(resolveHover)
}

// Every overlay feature is hovered, so the clones draw the hovered look
// without feature-state
const hoveredPaint = paint =>
    paint &&
    Object.fromEntries(
        Object.entries(paint).map(([key, value]) => [key, resolveHover(value)])
    )

const iconHighlightHalo = layer => ({
    id: `${layer.id}-highlight-halo`,
    type: 'circle',
    filter: layer.filter,
    paint: {
        'circle-color': ICON_HALO_COLOR,
        'circle-radius': ICON_HALO_RADIUS,
        'circle-blur': ICON_HALO_BLUR,
        'circle-opacity': iconHaloOpacity,
    },
})

// Text labels are also `type: 'symbol'` in maplibre-gl but have no icon-image
const isIconLayer = layer =>
    layer.type === 'symbol' && layer.layout?.['icon-image'] !== undefined

export const getOverlaySourceId = id => `${id}-highlight`

// Holds only the hovered/selected features, drawn by clones above the base layers
export const createHighlightOverlay = (map, { id, glLayers, beforeId }) => {
    const mapgl = map.getMapGL()
    const sourceId = getOverlaySourceId(id)
    const source = mapgl.getSource(sourceId)
    const colorPaint = []

    if (source) {
        source.setData(featureCollection())
    } else {
        mapgl.addSource(sourceId, {
            type: 'geojson',
            data: featureCollection(),
        })
    }

    const addOverlayLayer = (overlayLayer, colorProperty) => {
        if (!mapgl.getLayer(overlayLayer.id)) {
            mapgl.addLayer({ ...overlayLayer, source: sourceId }, beforeId)
        }
        if (colorProperty) {
            colorPaint.push({
                layerId: overlayLayer.id,
                property: colorProperty,
                value: overlayLayer.paint?.[colorProperty],
            })
        }
        return overlayLayer.id
    }

    const overlayLayerIds = glLayers.flatMap(layer => {
        if (isIconLayer(layer)) {
            // Halo first, so the icon clone renders on top of it
            return [
                addOverlayLayer(iconHighlightHalo(layer), 'circle-color'),
                addOverlayLayer({ ...layer, id: `${layer.id}-highlight-icon` }),
            ]
        }

        if (CLONEABLE_TYPES.has(layer.type)) {
            return [
                addOverlayLayer(
                    {
                        ...layer,
                        id: `${layer.id}-highlight`,
                        paint: hoveredPaint(layer.paint),
                    },
                    COLOR_PROPERTY[layer.type]
                ),
            ]
        }

        return []
    })

    getOverlays(mapgl).set(sourceId, {
        featureIds: new Set(),
        color: undefined,
        colorPaint,
    })

    return overlayLayerIds
}

// Sends only the features added or removed since the last update
export const updateHighlightOverlay = (map, { id, features, color }) => {
    const mapgl = map.getMapGL()
    const sourceId = getOverlaySourceId(id)
    const source = mapgl.getSource(sourceId)
    const overlay = getOverlays(mapgl).get(sourceId)

    if (!source || !overlay) {
        return
    }

    const featureIds = new Set(features.map(feature => feature.id))
    const add = features.filter(feature => !overlay.featureIds.has(feature.id))
    const remove = [...overlay.featureIds].filter(
        featureId => !featureIds.has(featureId)
    )

    if (add.length || remove.length) {
        source.updateData({ add, remove })
        overlay.featureIds = featureIds
    }

    if (color !== overlay.color) {
        overlay.colorPaint.forEach(({ layerId, property, value }) =>
            mapgl.setPaintProperty(layerId, property, color ?? value)
        )
        overlay.color = color
    }
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

    getOverlays(mapgl).delete(sourceId)
}
