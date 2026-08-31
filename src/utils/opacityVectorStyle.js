// 'hillshade' has no single opacity property and is intentionally omitted.
const opacityProperties = {
    background: ['background-opacity'],
    fill: ['fill-opacity'],
    line: ['line-opacity'],
    circle: ['circle-opacity', 'circle-stroke-opacity'],
    symbol: ['icon-opacity', 'text-opacity'],
    raster: ['raster-opacity'],
    'fill-extrusion': ['fill-extrusion-opacity'],
    heatmap: ['heatmap-opacity'],
}

// Wraps expressions instead of evaluating them, to preserve any existing
// data-driven behaviour (e.g. a zoom-based fade). Legacy stops/function
// values can't be scaled this way and are left unchanged.
const scaleValue = (baseValue, opacity) => {
    if (opacity === 1) {
        return baseValue
    }
    if (typeof baseValue === 'number') {
        return baseValue * opacity
    }
    if (Array.isArray(baseValue)) {
        return ['*', baseValue, opacity]
    }
    return baseValue
}

// WeakMap so mapgl instances are not prevented from being GC'd
// Caches each layer's own opacity value, so later scaling is relative to it
const _baseValueCache = new WeakMap()

const getBaseValue = (mapgl, layerId, property) => {
    let layerCache = _baseValueCache.get(mapgl)
    if (!layerCache) {
        layerCache = new Map()
        _baseValueCache.set(mapgl, layerCache)
    }
    let propertyCache = layerCache.get(layerId)
    if (!propertyCache) {
        propertyCache = new Map()
        layerCache.set(layerId, propertyCache)
    }
    if (!propertyCache.has(property)) {
        const value = mapgl.getPaintProperty(layerId, property)
        // Every opacity paint property defaults to 1 in the style spec
        propertyCache.set(property, value === undefined ? 1 : value)
    }
    return propertyCache.get(property)
}

export const clearVectorStyleOpacityCache = mapgl => {
    _baseValueCache.delete(mapgl)
}

export const setVectorStyleOpacity = (mapgl, opacity, layers) => {
    layers.forEach(layer => {
        opacityProperties[layer.type]?.forEach(property => {
            const baseValue = getBaseValue(mapgl, layer.id, property)
            const value = scaleValue(baseValue, opacity)
            try {
                mapgl.setPaintProperty(layer.id, property, value)
            } catch (error) {
                console.error(error)
            }
        })
    })
}
