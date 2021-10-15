import { Evented } from 'maplibre-gl'
import { mapStyle } from '../utils/style'

class VectorStyle extends Evented {
    constructor(options = {}) {
        super()
        this.options = options
        this._isOnMap = false
    }

    addTo(map) {
        this._map = map
        map.setBeforeLayerId(this.options.beforeId)
        const mapgl = map.getMapGL()
        map.removeOverlayEvents()

        mapgl.setStyle(this.options.url)
        mapgl.once('idle', this.onAdd)
    }

    onAdd = () => {
        this._isOnMap = true
        this._map.addOverlays()
    }

    removeFrom(map) {
        const mapgl = map.getMapGL()

        map.setBeforeLayerId(undefined)

        mapgl.setStyle(mapStyle)

        this._isOnMap = false
    }

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
