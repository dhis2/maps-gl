import {
    isPoint,
    isPolygon,
    isLine,
    isCluster,
    isHover,
} from '../utils/filters'
import { colorExpr, radiusExpr, clusterRadiusExpr } from './expressions'
import defaults from './style'

const getStrokeWidth = (width = 0) => [
    'case',
    isHover,
    width + defaults.hoverStrokeWidth,
    width + defaults.strokeWidth,
]

// Layer with point features
export const pointLayer = ({
    id,
    color,
    strokeColor,
    radius,
    source,
    filter,
}) => ({
    id: `${id}-point`,
    type: 'circle',
    source: source || id,
    paint: {
        'circle-color': colorExpr(color || defaults.noDataColor),
        'circle-radius': radiusExpr(radius || defaults.radius),
        'circle-stroke-width': getStrokeWidth(),
        'circle-stroke-color': strokeColor || defaults.strokeColor,
    },
    filter: filter || isPoint,
})

// Layer with line features
export const lineLayer = ({ id, color, width, source, filter }) => ({
    id: `${id}-line`,
    type: 'line',
    source: source || id,
    paint: {
        'line-color': color,
        'line-width': getStrokeWidth(width),
    },
    filter: filter || isLine,
})

// Layer with polygon features
export const polygonLayer = ({ id, color, source, filter }) => ({
    id: `${id}-polygon`,
    type: 'fill',
    source: source || id,
    paint: {
        'fill-color': colorExpr(color || defaults.noDataColor),
    },
    filter: filter || isPolygon,
})

// Polygon outline and hover state
// https://github.com/mapbox/mapbox-gl-js/issues/3018
export const outlineLayer = ({ id, color, source, filter }) => ({
    id: `${id}-outline`,
    type: 'line',
    source: source || id,
    paint: {
        'line-color': color || defaults.strokeColor,
        'line-width': getStrokeWidth(),
    },
    filter: filter || isPolygon,
})

// Layer with cluster (circles)
export const clusterLayer = ({ id, color }) => ({
    id: `${id}-cluster`,
    type: 'circle',
    source: id,
    filter: isCluster,
    paint: {
        'circle-color': color,
        'circle-radius': clusterRadiusExpr,
        'circle-stroke-width': defaults.strokeWidth,
        'circle-stroke-color': defaults.eventStrokeColor,
    },
})

//  Layer with cluster counts (text)
export const clusterCountLayer = ({ id }) => ({
    id: `${id}-count`,
    type: 'symbol',
    source: id,
    filter: isCluster,
    layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': defaults.textFont,
        'text-size': defaults.textSize,
    },
    paint: {
        'text-color': defaults.textColor,
    },
})
