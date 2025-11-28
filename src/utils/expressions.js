import { isHover } from './filters.js'
import { strokeWidth, hoverStrokeMultiplier } from './style.js'

// Returns color from feature with fallback
export const colorExpr = color => [
    'case',
    ['has', 'color'],
    ['get', 'color'],
    color,
]

// Returns width (weight) from feature with fallback and hover support
export const widthExpr = (width = strokeWidth) => [
    '*',
    ['case', ['has', 'weight'], ['get', 'weight'], width],
    ['case', isHover, hoverStrokeMultiplier, 1],
]

// Returns radius from feature with fallback
export const radiusExpr = radius => [
    'case',
    ['has', 'radius'],
    ['get', 'radius'],
    radius,
]

// Returns cluster radius
export const clusterRadiusExpr = [
    'step',
    ['get', 'point_count'],
    15,
    10,
    20,
    1000,
    25,
    10000,
    30,
]
