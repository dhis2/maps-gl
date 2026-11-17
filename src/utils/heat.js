export const setLayersOpacity = (mapgl, id, heatOpacity) => {
    mapgl
        .getStyle()
        .layers.filter(layer => layer.id.startsWith(id))
        .forEach(layer => {
            mapgl.setPaintProperty(layer.id, 'heatmap-opacity', heatOpacity)
        })
}

export const makeHeatmapIntensity = (i = 0.5) => Math.pow(i, 2) * 2

export const setLayersIntensity = (mapgl, id, heatIntensity) => {
    mapgl
        .getStyle()
        .layers.filter(layer => layer.id.startsWith(id))
        .forEach(layer => {
            mapgl.setPaintProperty(layer.id, 'heatmap-intensity', heatIntensity)
        })
}

export const makeHeatmapRadius = (r = 0.5) => [
    'interpolate',
    ['linear'],
    ['zoom'],
    7,
    50 * r,
    20,
    1000 * r,
]

export const setLayersRadius = (mapgl, id, heatRadius) => {
    mapgl
        .getStyle()
        .layers.filter(layer => layer.id.startsWith(id))
        .forEach(layer => {
            mapgl.setPaintProperty(layer.id, 'heatmap-radius', heatRadius)
        })
}
