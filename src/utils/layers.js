import { isPoint, isPolygon, isHover } from '../utils/filters'
import { colorExpr, radiusExpr } from './expressions'

const defaults = {
    noDataColor: '#CCC',
    strokeColor: '#333', // '#fff',
    strokeWeight: 1,
    hoverStrokeWeight: 3,
    radius: 6,
}

// Layer with point features
export const pointLayer = ({ id, color, radius, source, filter }) => ({        
    id: `${id}-point`,
    type: 'circle',
    source: source || id,
    paint: {
        'circle-color': colorExpr(color || defaults.noDataColor),
        'circle-radius': radiusExpr(radius || defaults.radius),
        'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            defaults.hoverStrokeWeight,
            defaults.strokeWeight,
        ],
        'circle-stroke-color': defaults.strokeColor,
    },
    filter: filter || isPoint,
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
export const outlineLayer = ({ id, source, filter }) => ({
    id: `${id}-outline`,
    type: 'line',
    source: source || id,
    paint: {
        'line-color': defaults.strokeColor,
        'line-width': [
            'case',
            isHover,
            defaults.hoverStrokeWeight,
            defaults.strokeWeight,
        ],
    },
    filter: filter || isPolygon,
})
