import Layer from './Layer'
import { getMapUrl, getFeatureInfoUrl } from '../utils/wms'

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
            console.log(getMapUrl(url, { layers, format }))

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

    onAdd() {
        this.getMap().on('click', this.onClick)
    }

    onClick = ({ coordinates }) => {
        const { url, layers } = this.options

        // console.log('###', coordinates)

        const test = getFeatureInfoUrl(url, { coordinates, layers })

        // console.log('onClick', coordinates, test)
    }
}

export default TileLayer
