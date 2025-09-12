export const setLayersIntensity = (mapgl, id, intensity) => {
    mapgl
        .getStyle()
        .layers.filter(layer => layer.id.startsWith(id))
        .forEach(layer => {
            mapgl.setPaintProperty(layer.id, 'heatmap-intensity', intensity)
        })
}
