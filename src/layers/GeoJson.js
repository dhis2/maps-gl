import Layer from './Layer'
import { isPoint, isPolygon, isLine, isHover } from '../utils/filters'

const defaultColor = '#333'
const defaultWeight = 1
const defaultRadius = 10
const hoverStrokeWeight = 3

// https://docs.mapbox.com/mapbox-gl-js/example/multiple-geometries/
class GeoJson extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    // TODO: Share with Choropleth?
    createSource() {
        const id = this.getId()
        const features = this.getFeatures()
        const { label, labelStyle } = this.options

        this.setSource(id, {
            type: 'geojson',
            data: features,
        })

        if (label) {
            this.setSource(
                `${id}-labels`,
                getLablesSource(features, labelStyle)
            )
        }
    }

    createLayers() {
        const id = this.getId()
        const { style = {} } = this.options
        const radius = style.tadius || defaultRadius
        const color = style.color || defaultColor
        const weight = style.weight || defaultWeight

        // Polygon layer
        this.addLayer(
            {
                id: `${id}-polygon`,
                type: 'fill',
                source: id,
                paint: {
                    'fill-color': color,
                },
                filter: isPolygon,
            },
            true
        )

        // Polygon outline (hover)
        this.addLayer({
            id: `${id}-outline`,
            type: 'line',
            source: id,
            paint: {
                'line-color': color,
                'line-width': ['case', isHover, hoverStrokeWeight, 0],
            },
            filter: isPolygon,
        })

        // Line layer
        this.addLayer(
            {
                id: `${id}-line`,
                type: 'line',
                source: id,
                paint: {
                    'line-color': color,
                    'line-width': ['case', isHover, weight + 3, weight],
                },
                filter: isLine,
            },
            true
        )

        // Point layer
        this.addLayer(
            {
                id: `${id}-point`,
                type: 'circle',
                source: id,
                paint: {
                    'circle-color': color,
                    'circle-radius': radius,
                    'circle-stroke-color': color,
                    'circle-stroke-width': [
                        'case',
                        isHover,
                        hoverStrokeWeight,
                        0,
                    ],
                },
                filter: isPoint,
            },
            true
        )
    }

    setOpacity(opacity) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(`${id}-polygon`, 'fill-opacity', opacity)
            mapgl.setPaintProperty(`${id}-line`, 'line-opacity', opacity)
            mapgl.setPaintProperty(`${id}-point`, 'circle-opacity', opacity)
        }
    }
}

export default GeoJson
