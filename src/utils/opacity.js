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

export const setLayersOpacity = (mapgl, id, opacity) => {
    mapgl
        .getStyle()
        .layers.filter(layer => layer.id.startsWith(id))
        .forEach(({ id: layerId, type }) => {
            if (mapgl.getLayer(layerId)) {
                properties[type]?.forEach(property => {
                    mapgl.setPaintProperty(
                        layerId,
                        property,
                        getOpacity(type, opacity)
                    )
                })
            }
        })
}
