import { Evented } from 'maplibre-gl'
import { mapStyle } from '../utils/style'

class VectorStyle extends Evented {
    constructor(options = {}) {
        super()
        this.options = options
        this._isOnMap = false
    }

    async addTo(map) {
        this._map = map
        map.setBeforeLayerId(this.options.beforeId)
        map.removeOverlayEvents()

        const mapgl = map.getMapGL()

        await this.setStyle(this.options.url)

        this._isOnMap = true
        this._map.addOverlays()
    }

    async removeFrom(map) {
        const mapgl = map.getMapGL()

        map.setBeforeLayerId(undefined)
        map.removeOverlayEvents()

        await this.setStyle(mapStyle)

        this._isOnMap = false
        this._map.addOverlays()
    }

    setStyle(style) {
        return new Promise(resolve => {
            const mapgl = this._map.getMapGL()
            mapgl.once('idle', () => {
                resolve()
            })

            mapgl.setStyle(style, false)
        })
    }

    onRemove = () => {}

    setIndex(index = 0) {
        this.options.index = index
    }

    setOpacity() {
        return
    }

    isInteractive() {
        return false
    }

    hasLayerId(id) {
        return false
    }

    isOnMap() {
        return this._isOnMap
    }

    getIndex() {
        return 0
    }
}

export default VectorStyle
