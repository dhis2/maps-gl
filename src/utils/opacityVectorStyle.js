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

// "zoom" is only valid as input to a top-level step/interpolate, so it
// can't be wrapped like scaleValue does below - scale its outputs instead.
const scaleZoomCurve = (expression, opacity) => {
    const [type, ...args] = expression
    const scaleOutputs = stops =>
        stops.map((value, i) => (i % 2 === 1 ? value * opacity : value))

    if (type === 'interpolate') {
        const [interpolation, input, ...stops] = args
        return ['interpolate', interpolation, input, ...scaleOutputs(stops)]
    }

    const [input, base, ...stops] = args
    return ['step', input, base * opacity, ...scaleOutputs(stops)]
}

// Wraps other expressions rather than evaluating them, to preserve existing
// data-driven behaviour. Legacy stops/function values are left unchanged.
const scaleValue = (baseValue, opacity) => {
    if (opacity === 1) {
        return baseValue
    }
    if (typeof baseValue === 'number') {
        return baseValue * opacity
    }
    if (
        Array.isArray(baseValue) &&
        ['interpolate', 'step'].includes(baseValue[0])
    ) {
        return scaleZoomCurve(baseValue, opacity)
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
