export const isPoint = ['==', '$type', 'Point']
export const isPolygon = ['==', '$type', 'Polygon']
export const isLine = ['==', '$type', 'LineString']

export const isCluster = ['==', 'cluster', true]
export const noCluster = ['!=', 'cluster', true]
export const isClusterPoint = ['all', isPoint, noCluster, ['!=', 'isPolygon', true]] 
export const isClusterPolygon = ['all', noCluster, ['==', 'isPolygon', true]] 

export const isHover = ['boolean', ['feature-state', 'hover'], false]
