import { Evented } from 'maplibre-gl'
import { mapStyle } from '../utils/style'
import { BASEMAP_POSITION } from '../utils/layers'

class VectorStyle extends Evented {
    constructor(options = {}) {
        super()
        this.options = options
        this._visibleLayers = []
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
            this._map._styleIsLoading = true
            await this.setStyle(style)
            this._map._styleIsLoading = false

            // Store id of all style layers that are visible
            this._visibleLayers = this._map
                .getMapGL()
                .getStyle()
                .layers.filter(l => l.layout?.visibility !== 'none')
                .map(l => l.id)
        }

        this._isOnMap = isOnMap
        await this.addOtherLayers()
    }

    // Add vector style to map
    async addTo(map) {
        this._map = map
        const { url, beforeId, isVisible } = this.options
        await this.toggleVectorStyle(true, url, beforeId)

        // Set vector style visibility after added to the map
        if (
            this.isVisible() === false ||
            (this.isVisible() === undefined && isVisible === false)
        ) {
            this.setVisibility(false)
        }
    }

    // Remove vector style from map, reset to default map style
    async removeFrom() {
        const glyphs = this._map._glyphs
        if (this._map.getMapGL()) {
            await this.toggleVectorStyle(false, mapStyle({ glyphs }))
        }
    }

    // Set map style, resolves promise when map is ready for other layers
    setStyle(style) {
        return new Promise((resolve, reject) => {
            this._map
                .getMapGL()
                .once('idle', resolve)
                .setStyle(style, { diff: false })
                .once('error', e => {
                    let msg
                    if (e.error.message.includes('missing required property')) {
                        msg = 'The vector style is malformed or invalid.'
                    } else if (
                        e.error.message.includes('r.blob is not a function')
                    ) {
                        msg = 'The vector style was not found.'
                    } else {
                        msg = 'An error occured while loading the vector style.'
                    }
                    reject(msg)
                })
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
                await layer.addTo(this._map)
                layer.setVisibility(layer.isVisible())
            }
        })
    }

    // Remove other layers from the map before style is changed
    async removeOtherLayers() {
        this.getOtherLayers().forEach(async layer => {
            if (layer.isOnMap()) {
                await layer.removeFrom(this._map, true)
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

    setVisibility(isVisible) {
        if (this.isOnMap()) {
            const mapgl = this._map.getMapGL()
            const value = isVisible ? 'visible' : 'none'

            this._visibleLayers.forEach(id =>
                mapgl.setLayoutProperty(id, 'visibility', value)
            )
        }

        this._isVisible = isVisible
    }

    isVisible() {
        return this._isVisible
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
