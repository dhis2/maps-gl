import Layer from './Layer'
const layerTypes = ['circle', 'heatmap']
const defaultCirclePaint = {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 2, 16, 4],
    'circle-color': '#FF0000',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
    'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 14, 1],
    'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 14, 1],
}
const defaultHeatmapPaint = {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 2, 16, 4],
    'circle-color': '#FF0000',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
    'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 14, 1],
    'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 14, 1],
}

class VectorTileLayer extends Layer {
    constructor(options) {
        super(options)

        const { url, ...layerOptions } = options
        this.createSource(url)
        this.createLayer(layerOptions)
    }

    createSource(url) {
        let tiles

        if (url.includes('{s}')) {
            tiles = ['a', 'b', 'c'].map(letter => url.replace('{s}', letter))
        } else {
            tiles = [url]
        }

        this.setSource(this.getId(), {
            type: 'vector',
            tiles,
        })
    }

    createLayer({ sourceLayer, layerType, minzoom, maxzoom, paint }) {
        const type = layerTypes.find(x => x === layerType) || 'circle'
        this.addLayer({
            id: this.getId(),
            type,
            source: this.getId(),
            'source-layer': sourceLayer,
            minzoom: minzoom || 0,
            paint:
                paint ||
                (type === 'circle'
                    ? defaultCirclePaint
                    : type === 'heatmap'
                    ? defaultHeatmapPaint
                    : undefined),
        })
    }

    setOpacity(opacity) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            mapgl.setPaintProperty(this.getId(), 'raster-opacity', opacity)
        }
    }
}

export default VectorTileLayer
