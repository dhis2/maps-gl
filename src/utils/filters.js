export const isPoint = ['==', '$type', 'Point']
export const isPolygon = ['==', '$type', 'Polygon']
export const isLine = ['==', '$type', 'LineString']

export const isCluster = ['==', 'cluster', true]
export const noCluster = ['!=', 'cluster', true]

export const isHover = ['boolean', ['feature-state', 'hover'], false]
