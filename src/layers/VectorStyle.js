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
        map.setStyle(this.options.url)
        map.waitForStyleLoaded().then(this.onAdd)
    }

    onAdd = () => {
        this._isOnMap = true
        this._map.addLayers()
    }

    removeFrom(map) {
        map.setBeforeLayerId(undefined)
        map.setStyle(mapStyle)
        map.waitForStyleLoaded().then(this.onRemove)
    }

    onRemove = () => {
        this._isOnMap = false
        this._map.addLayers()
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
