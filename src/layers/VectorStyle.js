import { Evented } from 'maplibre-gl'
import { mapStyle } from '../utils/style'
import { BASEMAP_POSITION, OVERLAY_START_POSITION } from '../utils/layers'

class VectorStyle extends Evented {
    constructor(options = {}) {
        super()
        this.options = options
        this._isOnMap = false
    }

    // Changing vector style will also delete all overlays on the map
    // Before we change the style we remove all overlays for a proper cleanup
    // After the style is changed and ready, we add the overlays back again
    async toggleVectorStyle(isOnMap, style, beforeId) {
        await this.removeOverlays()
        await this.setStyle(style)
        this._map.setBeforeLayerId(beforeId)
        this._isOnMap = isOnMap
        await this.addOverlays()
    }

    // Add vector style to map
    async addTo(map) {
        this._map = map
        const { url, beforeId } = this.options
        await this.toggleVectorStyle(true, url, beforeId)
    }

    // Remove vector style from map, reset to default map style
    async removeFrom() {
        await this.toggleVectorStyle(false, mapStyle)
    }

    // Set map style, resolves promise when map is ready for other layers
    setStyle(style) {
        return new Promise(resolve => {
            this._map
                .getMapGL()
                .once('idle', resolve)
                .setStyle(style, false)
        })
    }

    // Call handler for each overlay
    forEachOverlay(handler) {
        this._map.sortLayers() // Makes sure basemap is first layer
        const layers = this._map.getLayers()
        for (let i = OVERLAY_START_POSITION; i < layers.length; i++) {
            handler(layers[i])
        }
    }

    // Add each overlay to the map after map style is changed
    async addOverlays() {
        this.forEachOverlay(async layer => {
            if (!layer.isOnMap()) {
                await layer.addTo(this._map)
                layer.setVisibility(layer.isVisible())
            }
        })
    }

    // Remove each overlay from the map before style is changed
    async removeOverlays() {
        this.forEachOverlay(async layer => {
            if (layer.isOnMap()) {
                await layer.removeFrom(this._map)
            }
        })
    }

    setIndex(index = BASEMAP_POSITION) {
        this.options.index = index
    }

    // No opacity support for vector style
    setOpacity() {
        return
    }

    // Vector style basemap is not interactive
    isInteractive() {
        return false
    }

    // Vector style basemap has its own ids from the source
    hasLayerId() {
        return false
    }

    // Returns true if the vector style is fully added to the map
    isOnMap() {
        return this._isOnMap
    }

    // Vector style is only supported as basemap
    getIndex() {
        return BASEMAP_POSITION
    }
}

export default VectorStyle
