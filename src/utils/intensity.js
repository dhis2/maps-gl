export const setLayersIntensity = (mapgl, id, intensity) => {
    mapgl
        .getStyle()
        .layers.filter(layer => layer.id.startsWith(id))
        .forEach(layer => {
            const key = layer.id.split('-').pop()
            properties[key]?.forEach(property => {
                mapgl.setPaintProperty(layer.id, property, intensity)
            })
        })
}
