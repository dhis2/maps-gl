import { isPoint, isPolygon, isLine, isHover } from '../utils/filters'
import { colorExpr, radiusExpr } from './expressions'

const defaults = {
    noDataColor: '#CCC',
    strokeColor: '#333', 
    strokeWeight: 1,
    hoverStrokeWeight: 3,
    radius: 6,
}

const getWeight = (weight = 0) => [
    'case',
    isHover,
    weight + defaults.hoverStrokeWeight,
    weight + defaults.strokeWeight,
]

// Layer with point features
export const pointLayer = ({ id, color, strokeColor, radius, source, filter }) => ({        
    id: `${id}-point`,
    type: 'circle',
    source: source || id,
    paint: {
        'circle-color': colorExpr(color || defaults.noDataColor),
        'circle-radius': radiusExpr(radius || defaults.radius),
        'circle-stroke-width': getWeight(),
        'circle-stroke-color': strokeColor || defaults.strokeColor,
    },
    filter: filter || isPoint,
})

// Layer with line features
export const lineLayer = ({ id, color, weight, source, filter }) => ({
    id: `${id}-line`,
    type: 'line',
    source: source || id,
    paint: {
        'line-color': color,
        'line-width': getWeight(weight),
    },
    filter: filter || isLine,
})

// Layer with polygon features
export const polygonLayer = ({ id, color, source, filter }) => ({
    id: `${id}-polygon`,
    type: 'fill',
    source: source || id,
    paint: {
        'fill-color': colorExpr(color || defaults.noDataColor),
    },
    filter: filter || isPolygon,
})

// Polygon outline and hover state
// https://github.com/mapbox/mapbox-gl-js/issues/3018
export const outlineLayer = ({ id, color, source, filter }) => ({
    id: `${id}-outline`,
    type: 'line',
    source: source || id,
    paint: {
        'line-color': color || defaults.strokeColor,
        'line-width': getWeight(),
    },
    filter: filter || isPolygon,
})
