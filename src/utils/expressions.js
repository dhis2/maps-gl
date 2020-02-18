// Reeturns color from feature with fallback
export const colorExpr = (color) => ['case', ['has', 'color'], ['get', 'color'], color]