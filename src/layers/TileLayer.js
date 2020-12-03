import Layer from './Layer'
import { getMapUrl } from '../utils/wms'

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
        } = this.options
        let tiles

        if (layers) {
            tiles = [getMapUrl(url, { layers, format })] // WMS
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
        const id = this.getId()

        this.addLayer({
            id: `${id}-raster`,
            type: 'raster',
            source: id,
        })
    }
}

export default TileLayer
