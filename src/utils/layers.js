import {
    colorExpr,
    widthExpr,
    radiusExpr,
    clusterRadiusExpr,
} from './expressions.js'
import {
    isPointNoSymbol,
    isPolygon,
    isLine,
    isCluster,
    isSymbol,
} from './filters.js'
import {
    textFont,
    textSize,
    textColor,
    textOpacity,
    circleRadius,
    circleStrokeColor,
    circleOpacity,
    lineStrokeColor,
    lineOpacity,
    fillOpacity,
    iconOpacity,
    noDataColor,
    strokeWidth,
} from './style.js'

export const BASEMAP_POSITION = 0
export const OVERLAY_START_POSITION = 1

// Layer with point features
export const pointLayer = ({
    id,
    color,
    strokeColor,
    width,
    radius,
    opacity,
    source,
    filter,
}) => ({
    id: `${id}-point`,
    type: 'circle',
    source: source || id,
    paint: {
        'circle-color': colorExpr(color || noDataColor),
        'circle-radius': radiusExpr(radius || circleRadius),
        'circle-opacity': opacity ?? circleOpacity,
        'circle-stroke-width': widthExpr(width),
        'circle-stroke-color': strokeColor || circleStrokeColor,
        'circle-stroke-opacity': opacity ?? circleOpacity,
    },
    filter: filter || isPointNoSymbol,
})

// Layer with line features
export const lineLayer = ({ id, color, width, opacity, source, filter }) => ({
    id: `${id}-line`,
    type: 'line',
    source: source || id,
    paint: {
        'line-color': color || lineStrokeColor,
        'line-width': widthExpr(width),
        'line-opacity': opacity ?? lineOpacity,
    },
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    },
    filter: filter || isLine,
})

// Layer with polygon features
export const polygonLayer = ({ id, color, opacity, source, filter }) => ({
    id: `${id}-polygon`,
    type: 'fill',
    source: source || id,
    paint: {
        'fill-color': colorExpr(color || noDataColor),
        'fill-opacity': opacity ?? fillOpacity,
    },
    filter: filter || isPolygon,
})

// Polygon outline and hover state
// https://github.com/mapbox/mapbox-gl-js/issues/3018
export const outlineLayer = ({
    id,
    color,
    width,
    opacity,
    source,
    filter,
}) => ({
    id: `${id}-outline`,
    type: 'line',
    source: source || id,
    paint: {
        'line-color': color || lineStrokeColor,
        'line-width': widthExpr(width),
        'line-opacity': opacity ?? lineOpacity,
    },
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    },
    filter: filter || isPolygon,
})

export const symbolLayer = ({ id, opacity, source, filter }) => ({
    id: `${id}-symbol`,
    type: 'symbol',
    source: source || id,
    layout: {
        'icon-image': ['get', 'iconUrl'],
        'icon-size': 1,
        'icon-allow-overlap': true,
    },
    paint: {
        'icon-opacity': opacity ?? iconOpacity,
    },
    filter: filter || isSymbol,
})

// Layer with cluster (circles)
export const clusterLayer = ({ id, color, strokeColor, opacity }) => ({
    id: `${id}-cluster`,
    type: 'circle',
    source: id,
    filter: isCluster,
    paint: {
        'circle-color': color,
        'circle-radius': clusterRadiusExpr,
        'circle-opacity': opacity ?? circleOpacity,
        'circle-stroke-color': strokeColor,
        'circle-stroke-width': strokeWidth,
        'circle-stroke-opacity': opacity ?? circleOpacity,
    },
})

//  Layer with cluster counts (text)
export const clusterCountLayer = ({ id, color, opacity }) => ({
    id: `${id}-count`,
    type: 'symbol',
    source: id,
    filter: isCluster,
    layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': textFont,
        'text-size': textSize,
        'text-allow-overlap': true,
    },
    paint: {
        'text-color': color || textColor,
        'text-opacity': opacity ?? textOpacity,
    },
})

// Layer with heat surface
export const heatLayer = ({
    id,
    heatWeight = 1,
    heatIntensity = 0.5,
    heatColor,
    heatRadius,
    opacity = 1,
    source,
}) => ({
    id: `${id}-heat`,
    type: 'heatmap',
    source: source || id,
    paint: {
        // Increase the heatmap weight based on frequency and property magnitude
        'heatmap-weight': heatWeight,
        // Increase the heatmap color weight weight by zoom level
        // heatmap-intensity is a multiplier on top of heatmap-weight
        'heatmap-intensity': heatIntensity,
        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        // Begin color ramp at 0-stop with a 0-transparency color
        // to create a blur-like effect.
        'heatmap-color': heatColor,
        // Adjust the heatmap radius by zoom level
        'heatmap-radius': heatRadius,
        // Transition from heatmap to circle layer by zoom level
        'heatmap-opacity': opacity,
    },
})
