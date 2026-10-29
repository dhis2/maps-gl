import { Evented } from 'maplibre-gl'
import { v4 as uuidv4 } from 'uuid'
import { filterVisibleIds, normalizeIds } from '../utils/core.js'
import { getBoundsFromLayers } from '../utils/geometry.js'
import { updateHighlightOverlay } from '../utils/highlightOverlay.js'

class LayerGroup extends Evented {
    constructor(options) {
        super()

        this._id = uuidv4()
        this.options = options || {}
        this._layers = []
        this._layerConfigs = []
        this._isVisible = true
        this._hoverIds = []
        this._selectedIds = []
        this._visibleIds = null
        this._highlightColor = undefined
    }

    createLayer() {
        this._layerConfigs.forEach(config =>
            this._layers.push(this._map.createLayer(config))
        )

        // Sub-layers created after setVisibleIds() start with its ids
        if (this._visibleIds) {
            this._layers.forEach(layer => layer.setVisibleIds(this._visibleIds))
        }

        if (this.options.opacity) {
            this.setOpacity(this.options.opacity)
        }
    }

    async addTo(map) {
        this._map = map

        if (!this._layers.length) {
            this.createLayer()
        }

        this.on('contextmenu', this.onContextMenu)

        // Each sub-layer's overlay only exists once its own addTo() resolves
        await Promise.all(this._layers.map(layer => layer.addTo(map)))

        if (this._hoverIds.length || this._selectedIds.length) {
            this._syncOverlay()
        }
    }

    removeFrom(map) {
        this._layers.forEach(layer => layer.removeFrom(map))
        this.off('contextmenu', this.onContextMenu)
        this._map = null
    }

    getId() {
        return this._id
    }

    addLayer(config) {
        this._layerConfigs.push(config)
    }

    isOnMap() {
        return this._layers.some(layer => layer.isOnMap())
    }

    isInteractive() {
        return this._layers.some(layer => layer.isInteractive())
    }

    setIndex(index = 0) {
        this.options.index = index
        this._layers.forEach(layer => layer.setIndex(index))
    }

    getIndex() {
        return this.options.index || 0
    }

    getBounds() {
        return getBoundsFromLayers(this._layers)
    }

    getInteractiveIds() {
        return [].concat(
            ...this._layers.map(layer => layer.getInteractiveIds())
        )
    }

    getFeaturesById(id) {
        return this._layers.map(layer => layer.getFeaturesById(id)).flat()
    }

    getMap() {
        return this._map
    }

    getSubLayerFromId(id) {
        return this._layers.find(layer => layer.hasLayerId(id))
    }

    highlight(ids, color) {
        this._hoverIds = normalizeIds(ids)
        this._highlightColor = color
        this._syncOverlay()
    }

    select(ids, color) {
        this._selectedIds = normalizeIds(ids)
        this._highlightColor = color
        this._syncOverlay()
    }

    setVisibleIds(ids) {
        this._layers.forEach(layer => layer.setVisibleIds(ids))

        this._visibleIds = ids
        this._syncOverlay()
    }

    // A group overlay would reuse its sub-layers' overlay layer ids, so it fills theirs
    _syncOverlay() {
        const map = this.getMap()

        if (!map) {
            return
        }

        const ids = filterVisibleIds(
            [...new Set([...this._hoverIds, ...this._selectedIds])],
            this._visibleIds
        )

        this._layers.forEach(layer => {
            const features = ids.flatMap(id => layer.getFeaturesById(id))
            updateHighlightOverlay(map, {
                id: layer.getId(),
                features,
                color: this._highlightColor,
            })
        })
    }

    setOpacity(opacity) {
        this._layers.forEach(layer => layer.setOpacity(opacity))
    }

    setVisibility(isVisible) {
        this._layers.forEach(layer => layer.setVisibility(isVisible))
        this._isVisible = isVisible
    }

    isVisible() {
        return this._isVisible
    }

    move() {
        this._layers.forEach(layer => layer.move())
    }

    // The app handles hover for the whole group as soon as it does for one sub-layer
    handlesMouseEnter() {
        return this._layers.some(layer => layer.handlesMouseEnter())
    }

    hasLayerId(id) {
        return this._layers.some(layer =>
            layer.getLayers().some(layer => layer.id === id)
        )
    }

    onClick = evt => {
        const { feature } = evt

        if (feature) {
            const layer = this.getSubLayerFromId(feature.layer.id)

            if (layer) {
                layer.fire('click', evt)
            }
        }
    }

    onContextMenu = evt => {
        const { feature } = evt

        if (feature) {
            const layer = this.getSubLayerFromId(feature.layer.id)

            if (layer) {
                layer.fire('contextmenu', evt)
            }
        }
    }

    onMouseMove = (evt, feature) => {
        if (feature) {
            const layer = this.getSubLayerFromId(feature.layer.id)

            if (layer) {
                layer.onMouseMove(evt, feature)
            }
        }
    }
}

export default LayerGroup
