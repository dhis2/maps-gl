import Layer from './Layer'

class TileLayer extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayer()
    }

    createSource() {
        const { url, layers, format = 'image/png', attribution = '' } = this.options
        let tiles

        if (layers) {
            // WMS
            tiles = [
                `${url}?bbox={bbox-epsg-3857}&format=${format}&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=${layers}`,
            ]
        } else if (url.includes('{s}')) {
            tiles = ['a', 'b', 'c'].map(letter => url.replace('{s}', letter))
        } else {
            tiles = [url]
        }

        this.setSource(this.getId(), {
            type: 'raster',
            tiles,
            tileSize: 256,
            attribution,
        })
    }

    createLayer() {
        this.addLayer({
            id: this.getId(),
            type: 'raster',
            source: this.getId(),
        })
    }

    setOpacity(opacity) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            mapgl.setPaintProperty(this.getId(), 'raster-opacity', opacity)
        }
    }
}

export default TileLayer
