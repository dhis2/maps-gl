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

// `match` finds an id in constant time, where `in` scans the whole list per feature
const matchId = ids => ['match', ['get', 'id'], ids, true, false]

// A match list takes only strings or only integers, and no Object.prototype keys
export const idFilter = ids => {
    const strings = []
    const integers = []
    const others = []

    new Set(ids).forEach(id => {
        if (typeof id === 'string' && !(id in Object.prototype)) {
            strings.push(id)
        } else if (Number.isSafeInteger(id)) {
            integers.push(id)
        } else {
            others.push(id)
        }
    })

    const filters = [
        strings.length && matchId(strings),
        integers.length && matchId(integers),
        others.length && ['in', ['get', 'id'], ['literal', others]],
    ].filter(Boolean)

    if (filters.length < 2) {
        return filters[0] ?? false
    }

    return ['any', ...filters]
}

export const isHover = ['boolean', ['feature-state', 'hover'], false]
