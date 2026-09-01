import { Evented } from 'maplibre-gl'
import { BASEMAP_POSITION } from '../utils/layers.js'
import {
    setVectorStyleOpacity,
    clearVectorStyleOpacityCache,
} from '../utils/opacityVectorStyle.js'
import { mapStyle } from '../utils/style.js'

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
    //
    // _loadId, _styleIsLoading and _settlePendingStyleLoad below live on the
    // shared Map instance, not this VectorStyle - they track which call is
    // current across every basemap switch, since only one style load can be
    // in flight on the underlying mapgl at a time
    async toggleVectorStyle(isOnMap, style, beforeId) {
        // Identifies this call, so a stale result isn't applied/thrown below
        // for a load since superseded by another toggleVectorStyle() call
        const loadId = (this._map._loadId = (this._map._loadId || 0) + 1)
        const isCurrent = () => this._map._loadId === loadId

        await this.removeOtherLayers()
        this._map.setBeforeLayerId(beforeId)

        // Removal has no failure mode to worry about, so clear this eagerly.
        // Being added is only true once the load actually succeeds, below
        if (!isOnMap) {
            this._isOnMap = false
        }

        // (Re)set map style if user is not switching to a new one
        let styleError

        if (isOnMap || !this.mapHasVectorStyle()) {
            try {
                this._map._styleIsLoading = true
                await this.setStyle(style)

                if (isCurrent()) {
                    this._isOnMap = isOnMap
                    this._applyLoadedStyle()
                }
            } catch (error) {
                // Still restore overlays below even if the style failed to
                // load, so a broken basemap doesn't take other layers with
                // it. isCurrent() here only matters for a call invalidated
                // before it reached setStyle() (the branch below) - setStyle()
                // itself always resolves a superseded call instead of
                // rejecting it
                if (isCurrent()) {
                    styleError = error
                }
            } finally {
                if (isCurrent()) {
                    this._map._styleIsLoading = false
                }
            }
        } else {
            // This call never touches setStyle(), so settle any earlier
            // call still waiting on it (same as setStyle() does on its own
            // start) and clear the loading flag on its behalf, since this
            // call is now current and isn't loading anything itself
            this._map._settlePendingStyleLoad?.()
            this._map._styleIsLoading = false
        }

        // Only the current call re-adds overlays - otherwise every
        // overlapping call would independently race to add the same ones
        if (isCurrent()) {
            await this.addOtherLayers()
        }

        if (styleError) {
            throw styleError
        }
    }

    // Snapshots the newly loaded style's layers and re-applies opacity to it
    _applyLoadedStyle() {
        const mapgl = this._map.getMapGL()

        // Style layers/ids are brand new after a style change, so any cached
        // "original" opacity values from the previous style are stale and
        // must not be reused
        clearVectorStyleOpacityCache(mapgl)

        // Overlay layers share this same mapgl style, so this snapshot is
        // what scopes opacity to the vector style's own layers
        this._styleLayers = mapgl.getStyle().layers

        // Store id of all style layers that are visible
        this._visibleLayers = this._styleLayers
            .filter(l => l.layout?.visibility !== 'none')
            .map(l => l.id)

        const opacity = this.options.opacity ?? 1
        const labelOpacity = this.options.labelOpacity ?? 1

        if (opacity !== 1 || labelOpacity !== 1) {
            this.setOpacity(opacity)
        }
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
        // Map.addLayer() can call this a second, redundant time on the same instance
        if (this._removed) {
            return
        }
        this._removed = true

        const glyphs = this._map._glyphs
        if (this._map.getMapGL()) {
            await this.toggleVectorStyle(false, mapStyle({ glyphs }))
        }
    }

    // Set map style, resolves promise when map is ready for other layers
    setStyle(style) {
        return new Promise((resolve, reject) => {
            const mapgl = this._map.getMapGL()

            // 'idle'/'error' are shared, map-level events - if an earlier
            // call is still waiting on them, it's about to be superseded,
            // so detach its listeners and settle it now instead of leaving
            // two calls listening for the same event
            this._map._settlePendingStyleLoad?.()

            const onIdle = () => {
                this._map._settlePendingStyleLoad = null
                resolve()
            }
            const onError = e => {
                this._map._settlePendingStyleLoad = null
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
            }

            this._map._settlePendingStyleLoad = () => {
                mapgl.off('idle', onIdle)
                mapgl.off('error', onError)
                resolve()
            }

            mapgl.once('idle', onIdle)
            mapgl.setStyle(style, { diff: false })
            mapgl.once('error', onError)
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

    setOpacity(opacity) {
        if (typeof opacity !== 'number') {
            return
        }

        this.options.opacity = opacity

        const mapgl = this._map?.getMapGL()

        if (mapgl && this.isOnMap() && this._styleLayers) {
            setVectorStyleOpacity(mapgl, this._styleLayers, {
                opacity,
                labelOpacity: this.options.labelOpacity ?? 1,
            })
        }
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
