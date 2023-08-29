import Layer from './Layer'

class TileLayer extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayer()
    }

    createSource() {
        const {
            url,
            layers,
            format = 'image/png',
            attribution = '',
            tileSize = 256,
        } = this.options

        let tiles

        if (layers) {
            // WMS
            tiles = [
                `${url}?bbox={bbox-epsg-3857}&format=${format}&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=${tileSize}&height=${tileSize}&layers=${layers}`,
            ]
        } else if (url.includes('{s}')) {
            tiles = ['a', 'b', 'c'].map(letter => url.replace('{s}', letter))
        } else {
            tiles = [url]
        }

        this.setSource(this.getId(), {
            type: 'raster',
            tiles,
            tileSize,
            attribution,
        })
    }

    createLayer() {
        const id = this.getId()

        this.addLayer({
            id: `${id}-raster`,
            type: 'raster',
            source: id,
        })
    }
}

export default TileLayer
