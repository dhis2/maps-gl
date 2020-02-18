import { isPoint, isPolygon, isHover } from '../utils/filters'
import { colorExpr } from './expressions'

const strokeColor = '#fff';
const strokeWeight = 1;
const hoverStrokeWeight = 3;

export const pointLayer = ({ id, color, radius }) => ({        
    id: `${id}-point`,
    type: 'circle',
    source: id,
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
    filter: isPoint,
})

export const polygonLayer = ({ id, color }) => ({
    id: `${id}-polygon`,
    type: 'fill',
    source: id,
    paint: {
        'fill-color': colorExpr(color),
    },
    filter: isPolygon,
})

// Polygon outline and hover state
// https://github.com/mapbox/mapbox-gl-js/issues/3018
export const outlineLayer = ({ id }) => ({
    id: `${id}-outline`,
    type: 'line',
    source: id,
    paint: {
        'line-color': strokeColor,
        'line-width': [
            'case',
            isHover,
            hoverStrokeWeight,
            strokeWeight,
        ],
    },
    filter: isPolygon,
})
