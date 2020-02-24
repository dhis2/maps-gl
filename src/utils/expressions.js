// Returns color from feature with fallback
export const colorExpr = (color) => ['case', ['has', 'color'], ['get', 'color'], color]

// Returns radius from feature with fallback
export const radiusExpr = (radius) => ['case', ['has', 'radius'], ['get', 'radius'], radius]

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