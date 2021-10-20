import { Evented } from 'maplibre-gl'
import { mapStyle } from '../utils/style'
import { BASEMAP_POSITION, OVERLAY_START_POSITION } from '../utils/layers'

class VectorStyle extends Evented {
    constructor(options = {}) {
        super()
        this.options = options
        this._isOnMap = false
    }

    async addTo(map) {
        this._map = map
        map.setBeforeLayerId(this.options.beforeId)
        this.removeOverlayEvents()

        await this.setStyle(this.options.url)

        this._isOnMap = true
        this.addOverlays()
    }

    async removeFrom(map) {
        map.setBeforeLayerId(undefined)
        this.removeOverlayEvents()

        await this.setStyle(mapStyle)

        this._isOnMap = false
        this.addOverlays()
    }

    setStyle(style) {
        return new Promise(resolve => {
            this._map
                .getMapGL()
                .once('idle', resolve)
                .setStyle(style, false)
        })
    }

    async addOverlays() {
        const layers = this._map.getLayers()

        for (let i = OVERLAY_START_POSITION; i < layers.length; i++) {
            const layer = layers[i]
            if (!layer.isOnMap()) {
                await layer.addTo(this._map)
                layer.setVisibility(layer.isVisible())
                layer.addEventListeners()
            }
        }
    }

    removeOverlayEvents() {
        this._map.sortLayers()

        const layers = this._map.getLayers()

        if (layers.length <= 1) {
            return
        }

        for (let i = OVERLAY_START_POSITION; i < layers.length; i++) {
            layers[i].removeEventListeners()
        }
    }

    setIndex(index = BASEMAP_POSITION) {
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
        return BASEMAP_POSITION
    }
}

export default VectorStyle
