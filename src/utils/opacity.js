const properties = {
    'point': ['circle-opacity', 'circle-stroke-opacity'],
    'polygon': ['fill-opacity'],
    'line': ['line-opacity'],
    'outline': ['line-opacity'],
    'buffer': ['fill-opacity'],
    'buffer-outline': ['line-opacity'],
    'label': ['text-opacity'],
    'icon': ['icon-opacity'],
    'cluster': ['circle-opacity', 'circle-stroke-opacity'],
    'count': ['text-opacity'],
}

const opacityFactor =  {
    'buffer': 0.2,
    'buffer-outline': 0.2,
}

const getOpacity = (key, opacity) =>  opacity * (opacityFactor[key] || 1)

export const setLayersOpacity = (mapgl, id, opacity) => {
    Object.keys(properties).forEach(key => {
        const layerId = `${id}-${key}`

        if (mapgl.getLayer(layerId)) {
            properties[key].forEach(property => 
                mapgl.setPaintProperty(layerId, property, getOpacity(key, opacity))
            )
        }
    })
}

