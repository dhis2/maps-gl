//  Returns resolution in meters at zoom
export const getZoomResolution = zoom =>
    (2 * Math.PI * 6378137) / 256 / Math.pow(2, zoom)

// Returns lng/lat bounds for a tile
export const getTileBBox = (x, y, z) => {
    var e = tile2lon(x + 1, z)
    var w = tile2lon(x, z)
    var s = tile2lat(y + 1, z)
    var n = tile2lat(y, z)
    return [w, s, e, n].join(',')
}

const tile2lon = (x, z) => (x / Math.pow(2, z)) * 360 - 180

const tile2lat = (y, z) => {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z)
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}
