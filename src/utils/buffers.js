import circle from '@turf/circle'
import polygonBuffer from '@turf/buffer'
import { featureCollection } from './geometry'
import { colorExpr } from './expressions'

const defaults = {
    color: '#95c8fb',
    width: 1,
}

const getBufferGeometry = ({ geometry }, buffer) => 
    (geometry.type === 'Point' ? circle(geometry, buffer) : polygonBuffer(geometry, buffer)).geometry

// Buffer in km
export const bufferSource = (features, buffer) => ({
    type: 'geojson',
    data: featureCollection(features.map(feature => ({
        ...feature,
        geometry: getBufferGeometry(feature, buffer)
    }))),
})

// Layer with buffer features
export const bufferLayer = ({ id, color }) => ({
    id: `${id}-buffer`,
    type: 'fill',
    source: `${id}-buffer`,
    paint: {
        'fill-color': colorExpr(color || defaults.color),
    },
})

// Buffer outline
export const bufferOutlineLayer = ({ id, color, width }) => ({
    id: `${id}-buffer-outline`,
    type: 'line',
    source: `${id}-buffer`,
    paint: {
        'line-color': colorExpr(color || defaults.color),
        'line-width': width || defaults.width,
    },
})
