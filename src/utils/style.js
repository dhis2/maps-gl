export const textFont = ['Open Sans Bold']
export const textSize = 16
export const textColor = '#FFFFFF'

export const radius = 6

export const noDataColor = '#CCCCCC'

export const strokeColor = '#333333'
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

export default {
    textFont,
    textSize,
    textColor,
    radius,
    noDataColor,
    strokeColor,
    strokeWidth,
    hoverStrokeMultiplier,
    eventStrokeColor,
    clusterCountColor,
}
