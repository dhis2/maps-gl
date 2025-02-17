import {
    isPointNoSymbol,
    isPolygon,
    isLine,
    isCluster,
    isSymbol,
} from './filters'
import {
    colorExpr,
    widthExpr,
    radiusExpr,
    clusterRadiusExpr,
} from './expressions'
import defaults from './style'

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
        'circle-color': colorExpr(color || defaults.noDataColor),
        'circle-radius': radiusExpr(radius || defaults.radius),
        'circle-opacity': opacity ?? defaults.opacity,
        'circle-stroke-width': widthExpr(width),
        'circle-stroke-color': strokeColor || defaults.strokeColor,
        'circle-stroke-opacity': opacity ?? defaults.opacity,
    },
    filter: filter || isPointNoSymbol,
})

// Layer with line features
export const lineLayer = ({ id, color, width, opacity, source, filter }) => ({
    id: `${id}-line`,
    type: 'line',
    source: source || id,
    paint: {
        'line-color': color || defaults.strokeColor,
        'line-width': widthExpr(width),
        'line-opacity': opacity ?? defaults.opacity,
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
        'fill-color': colorExpr(color || defaults.noDataColor),
        'fill-opacity': opacity ?? defaults.opacity,
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
        'line-color': color || defaults.strokeColor,
        'line-width': widthExpr(width),
        'line-opacity': opacity ?? defaults.opacity,
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
        'icon-opacity': opacity ?? defaults.opacity,
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
        'circle-opacity': opacity ?? defaults.opacity,
        'circle-stroke-color': strokeColor,
        'circle-stroke-width': defaults.strokeWidth,
        'circle-stroke-opacity': opacity ?? defaults.opacity,
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
        'text-font': defaults.textFont,
        'text-size': defaults.textSize,
        'text-allow-overlap': true,
    },
    paint: {
        'text-color': color || defaults.textColor,
        'text-opacity': opacity ?? defaults.opacity,
    },
})

// Layer with heat surface
export const heatLayer = ({ id, source }) => ({
    id: `${id}-heat`,
    type: 'heatmap',
    source: source || id,
    paint: {
        // Increase the heatmap weight based on frequency and property magnitude
        'heatmap-weight': 1,
        // Increase the heatmap color weight weight by zoom level
        // heatmap-intensity is a multiplier on top of heatmap-weight
        'heatmap-intensity': 1,
        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        // Begin color ramp at 0-stop with a 0-transparency color
        // to create a blur-like effect.
        'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(33,102,172,0)',
            0.2,
            'rgb(103,169,207)',
            0.4,
            'rgb(209,229,240)',
            0.6,
            'rgb(253,219,199)',
            0.8,
            'rgb(239,138,98)',
            1,
            'rgb(178,24,43)',
        ],
        // Adjust the heatmap radius by zoom level
        'heatmap-radius': 30,
        // Transition from heatmap to circle layer by zoom level
        'heatmap-opacity': 1,
    },
})
