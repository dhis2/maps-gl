export const textFont = ['Open Sans Bold']
export const textSize = 16
export const textColor = '#FFFFFF'
export const textOpacity = 1

export const circleRadius = 6
export const circleStrokeColor = '#333333'
export const circleOpacity = 1

export const lineStrokeColor = '#333333'
export const lineOpacity = 1

export const fillOpacity = 1

export const iconOpacity = 1

export const noDataColor = '#CCCCCC'

export const strokeWidth = 1
export const hoverStrokeMultiplier = 3

export const eventStrokeColor = '#333333'
export const clusterCountColor = '#000000'

export const defaultGlyphs =
    'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'

export const mapStyle = ({ glyphs = defaultGlyphs }) => ({
    version: 8,
    sources: {},
    layers: [],
    glyphs,
})
