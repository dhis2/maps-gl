const getCluster = ['get', 'cluster']
const getIsPolygon = ['get', 'isPolygon']
const hasImage = ['has', 'iconUrl']

export const isPoint = ['==', ['geometry-type'], 'Point']
export const isPolygon = ['==', ['geometry-type'], 'Polygon']
export const isLine = ['==', ['geometry-type'], 'LineString']
export const isSymbol = ['all', isPoint, hasImage]
export const isPointNoSymbol = ['all', isPoint, ['==', hasImage, false]]

export const isCluster = ['==', getCluster, true]
export const noCluster = ['!=', getCluster, true]
export const isClusterPoint = [
    'all',
    isPoint,
    noCluster,
    ['!=', getIsPolygon, true],
]
export const isClusterPolygon = ['all', noCluster, ['==', getIsPolygon, true]]

export const isHover = ['boolean', ['feature-state', 'hover'], false]
