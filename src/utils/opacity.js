const properties = {
    raster: ['raster-opacity'],
    point: ['circle-opacity', 'circle-stroke-opacity'],
    polygon: ['fill-opacity'],
    line: ['line-opacity'],
    outline: ['line-opacity'],
    buffer: ['fill-opacity'],
    'buffer-outline': ['line-opacity'],
    label: ['text-opacity'],
    symbol: ['icon-opacity', 'text-opacity'],
    cluster: ['circle-opacity', 'circle-stroke-opacity'],
    count: ['text-opacity'],
}

const opacityFactor = {
    buffer: 0.2,
    'buffer-outline': 0.2,
}

const getOpacity = (key, opacity) => opacity * (opacityFactor[key] || 1)

// WeakMap so mapgl instances are not prevented from being GC'd
const _subLayerCache = new WeakMap()

const getSubLayerIds = (mapgl, id) => {
    let instanceCache = _subLayerCache.get(mapgl)
    if (!instanceCache) {
        instanceCache = new Map()
        _subLayerCache.set(mapgl, instanceCache)
    }
    if (!instanceCache.has(id)) {
        instanceCache.set(
            id,
            mapgl
                .getStyle()
                .layers.filter(layer => layer.id.startsWith(id))
                .map(layer => layer.id)
        )
    }
    return instanceCache.get(id)
}

export const clearLayerOpacityCache = (mapgl, id) => {
    _subLayerCache.get(mapgl)?.delete(id)
}

export const setLayersOpacity = (mapgl, id, opacity) => {
    getSubLayerIds(mapgl, id).forEach(layerId => {
        const key = layerId.split('-').pop()
        const value = getOpacity(key, opacity)
        properties[key]?.forEach(property => {
            mapgl.setPaintProperty(layerId, property, value)
        })
    })
}
