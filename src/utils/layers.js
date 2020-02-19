import { isPoint, isPolygon, isHover } from '../utils/filters'
import { colorExpr } from './expressions'

const strokeColor = '#fff';
const strokeWeight = 1;
const hoverStrokeWeight = 3;

// Layer with point features
export const pointLayer = ({ id, color, radius, source, filter }) => ({        
    id: `${id}-point`,
    type: 'circle',
    source: source || id,
    paint: {
        'circle-color': colorExpr(color),
        'circle-radius': radius,
        'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            hoverStrokeWeight,
            strokeWeight,
        ],
        'circle-stroke-color': strokeColor,
    },
    filter: filter || isPoint,
})

// Layer with polygon features
export const polygonLayer = ({ id, color, source, filter }) => ({
    id: `${id}-polygon`,
    type: 'fill',
    source: source || id,
    paint: {
        'fill-color': colorExpr(color),
    },
    filter: filter || isPolygon,
})

// Polygon outline and hover state
// https://github.com/mapbox/mapbox-gl-js/issues/3018
export const outlineLayer = ({ id, source, filter }) => ({
    id: `${id}-outline`,
    type: 'line',
    source: source || id,
    paint: {
        'line-color': strokeColor,
        'line-width': [
            'case',
            isHover,
            hoverStrokeWeight,
            strokeWeight,
        ],
    },
    filter: filter || isPolygon,
})
