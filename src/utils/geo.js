const earthRadius = 6378137

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

// Returns true if two bbox'es overlaps
// https://rbrundritt.wordpress.com/2009/10/03/determining-if-two-bounding-boxes-overlap/
export const bboxOverlap = (bbox1, bbox2) => {
    const [minLng1, minLat1, maxLng1, maxLat1] = bbox1
    const [minLng2, minLat2, maxLng2, maxLat2] = bbox1

    const absLng = Math.abs(minLng1 + maxLng1 - minLng2 - maxLng2) 
    const absLat = Math.abs(maxLat1 + minLat1 - maxLat2 - minLat2) 

    const raxLng = maxLng1 - minLng1 + maxLng2 - minLng2
    const raxLat = maxLat1 - minLat1 + maxLat2 - minLat2

    if (absLng <= raxLng && absLat <= raxLat) {
        return true;
    }

    return false
}

    