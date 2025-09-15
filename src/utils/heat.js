export const setLayersIntensity = (mapgl, id, intensity) => {
    mapgl
        .getStyle()
        .layers.filter(layer => layer.id.startsWith(id))
        .forEach(layer => {
            mapgl.setPaintProperty(layer.id, 'heatmap-intensity', intensity)
        })
}

const makeHeatmapRadius = r => [
    'interpolate',
    ['linear'],
    ['zoom'],
    7,
    50 * r,
    20,
    1000 * r,
]

export const setLayersRadius = (mapgl, id, radius) => {
    mapgl
        .getStyle()
        .layers.filter(layer => layer.id.startsWith(id))
        .forEach(layer => {
            mapgl.setPaintProperty(
                layer.id,
                'heatmap-radius',
                makeHeatmapRadius(radius)
            )
        })
}
