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

    // Overlays are removed/re-added around a style change, since changing
    // style wipes them. The load-tracking fields below live on the shared
    // Map, not this instance, since only one style can load at a time
    async toggleVectorStyle(isOnMap, style, beforeId) {
        // Identifies this call, so a superseded result below is ignored
        const loadId = (this._map._loadId = (this._map._loadId || 0) + 1)
        const isCurrent = () => this._map._loadId === loadId

        await this.removeOtherLayers()
        this._map.setBeforeLayerId(beforeId)

        // Removal can't fail, so clear eagerly; added is only set on success
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
                // Overlays are still restored below before this re-throws.
                // isCurrent() only guards a call invalidated before reaching
                // setStyle() - setStyle() itself always resolves (never
                // rejects) a superseded call
                if (isCurrent()) {
                    styleError = error
                }
            } finally {
                if (isCurrent()) {
                    this._map._styleIsLoading = false
                }
            }
        } else if (isCurrent()) {
            // Skips setStyle(), so settle any earlier pending call and
            // clear the loading flag on its behalf instead
            this._map._settlePendingStyleLoad?.()
            this._map._styleIsLoading = false
        }

        // Only the current call re-adds overlays, to avoid racing duplicates
        if (isCurrent()) {
            await this.addOtherLayers()

            // A mouse event during the removal above can cache this as an
            // empty (but truthy) array forever - refresh it now that
            // overlays are back, so hover/click keep working
            this._map._interactiveLayerIds = null
        }

        if (styleError) {
            throw styleError
        }
    }

    // Snapshots the newly loaded style's layers and re-applies opacity to it
    _applyLoadedStyle() {
        const mapgl = this._map.getMapGL()

        // Layer ids are new after a style change, so cached base-opacity
        // values from the old style are stale
        clearVectorStyleOpacityCache(mapgl)

        // Scopes opacity to just these layers, not overlays sharing this mapgl
        this._styleLayers = mapgl.getStyle().layers

        this._visibleLayers = this._styleLayers
            .filter(l => l.layout?.visibility !== 'none')
            .map(l => l.id)

        const opacity = this.options.opacity ?? 1
        const labelOpacity = this.options.labelOpacity ?? 1

        if (opacity !== 1 || labelOpacity !== 1) {
            this.setOpacity(opacity)
        }
    }

    async addTo(map) {
        this._map = map
        this._removed = false
        const { url, beforeId, isVisible } = this.options
        await this.toggleVectorStyle(true, url, beforeId)

        if (
            this.isVisible() === false ||
            (this.isVisible() === undefined && isVisible === false)
        ) {
            this.setVisibility(false)
        }
    }

    // Resets to the default map style
    async removeFrom() {
        // addLayer() can call this a second, redundant time on this instance
        if (this._removed) {
            return
        }
        this._removed = true

        const glyphs = this._map._glyphs
        if (this._map.getMapGL()) {
            await this.toggleVectorStyle(false, mapStyle({ glyphs }))
        }
    }

    // Resolves once ready for other layers to be added back
    setStyle(style) {
        return new Promise((resolve, reject) => {
            const mapgl = this._map.getMapGL()

            // 'idle'/'error' are shared map-level events - detach and settle
            // any earlier call now, instead of leaving two calls listening
            // for the same one
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
                this._map._settlePendingStyleLoad = null
                mapgl.off('idle', onIdle)
                mapgl.off('error', onError)
                resolve()
            }

            mapgl.once('idle', onIdle)
            mapgl.setStyle(style, { diff: false })
            mapgl.once('error', onError)
        })
    }

    getOtherLayers() {
        return this._map
            .getLayers()
            .filter(layer => !(layer instanceof VectorStyle))
    }

    async addOtherLayers() {
        this.getOtherLayers().forEach(async layer => {
            if (!layer.isOnMap()) {
                await layer.addTo(this._map)
                layer.setVisibility(layer.isVisible())
            }
        })
    }

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

    isOnMap() {
        return this._isOnMap
    }

    // Vector style is only supported as basemap
    getIndex() {
        return BASEMAP_POSITION
    }
}

export default VectorStyle
