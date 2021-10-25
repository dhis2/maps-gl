import { Evented } from 'maplibre-gl'
import { mapStyle } from '../utils/style'
import { BASEMAP_POSITION } from '../utils/layers'

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
        await this.removeOtherLayers()
        this._map.setBeforeLayerId(beforeId)

        // (Re)set map style if user is not switching to a new one
        if (isOnMap || !this.mapHasVectorStyle()) {
            await this.setStyle(style)
        }

        this._isOnMap = isOnMap
        await this.addOtherLayers()
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
                .setStyle(style, { diff: false })
        })
    }

    // Returns all layers that are not vector style
    getOtherLayers() {
        return this._map
            .getLayers()
            .filter(layer => !(layer instanceof VectorStyle))
    }

    // Add other layers to the map after style is changed
    async addOtherLayers() {
        this.getOtherLayers().forEach(async layer => {
            if (!layer.isOnMap()) {
                // await layer.addTo(this._map)
                layer.setVisibility(layer.isVisible())
            }
        })
    }

    // Remove other layers from the map before style is changed
    async removeOtherLayers() {
        this.getOtherLayers().forEach(async layer => {
            if (layer.isOnMap()) {
                await layer.removeFrom(this._map)
            }
        })
    }

    mapHasVectorStyle() {
        return this._map.getLayers().some(layer => layer instanceof VectorStyle)
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
