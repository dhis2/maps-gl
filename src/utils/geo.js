export const earthRadius = 6378137

const tile2lon = (x, z) => (x / Math.pow(2, z)) * 360 - 180

const tile2lat = (y, z) => {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z)
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

//  Returns resolution in meters at zoom
export const getZoomResolution = zoom =>
    (2 * Math.PI * earthRadius) / 256 / Math.pow(2, zoom)

// Returns lng/lat bounds for a tile
export const getTileBBox = (x, y, z) => {
    const e = tile2lon(x + 1, z)
    const w = tile2lon(x, z)
    const s = tile2lat(y + 1, z)
    const n = tile2lat(y, z)
    return [w, s, e, n].join(',')
}

// Returns true if two bbox'es intersects
export const bboxIntersect = (bbox1, bbox2) =>
    !(
        bbox1[0] > bbox2[2] ||
        bbox1[2] < bbox2[0] ||
        bbox1[3] < bbox2[1] ||
        bbox1[1] > bbox2[3]
    )
