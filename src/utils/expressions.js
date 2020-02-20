// Returns color from feature with fallback
export const colorExpr = (color) => ['case', ['has', 'color'], ['get', 'color'], color]

// Returns radius from feature with fallback
export const radiusExpr = (radius) => ['case', ['has', 'radius'], ['get', 'radius'], radius]