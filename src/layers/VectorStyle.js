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
        map.removeOverlayEvents()

        const mapgl = map.getMapGL()

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
        map.removeOverlayEvents()

        mapgl.setStyle(mapStyle)
        mapgl.once('idle', this.onRemove)
    }

    onRemove = () => {
        this._isOnMap = false
        this._map.addOverlays()
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
