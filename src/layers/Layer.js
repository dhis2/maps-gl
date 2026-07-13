import bbox from '@turf/bbox'
import { Evented } from 'maplibre-gl'
import { v4 as uuidv4 } from 'uuid'
import { bufferSource } from '../utils/buffers.js'
import { dropHiddenIds, normalizeIds } from '../utils/core.js'
import { featureCollection } from '../utils/geometry.js'
import {
    createHighlightOverlay,
    updateHighlightOverlay,
    removeHighlightOverlay,
} from '../utils/highlightOverlay.js'
import { addImages } from '../utils/images.js'
import { labelSource } from '../utils/labels.js'
import { setLayersOpacity, clearLayerOpacityCache } from '../utils/opacity.js'

class Layer extends Evented {
    constructor(options = {}) {
        super()
        this._id = uuidv4()

        this._source = {}
        this._layers = []
        this._features = []
        this._isVisible = true
        this._interactiveIds = []
        this._overlayLayerIds = []
        this._hoverIds = []
        this._selectedIds = []
        this._highlightColor = undefined

        this.options = options

        if (options.data) {
            this.setFeatures(options.data)
        }
    }

    async addTo(map) {
        const { opacity, onClick, onRightClick, onMouseEnter, onMouseLeave } =
            this.options

        this._map = map

        const mapgl = map.getMapGL()
        const images = this.getImages()
        const source = this.getSource()
        const layers = this.getLayers()
        const beforeId = map.getBeforeLayerId()

        this.locale = mapgl._getUIString.bind(mapgl)

        if (images) {
            try {
                await addImages(mapgl, images)
            } catch (error) {
                this.onError(error)
            }
        }

        Object.keys(source).forEach(id => {
            if (map.styleIsLoaded() && !mapgl.getSource(id)) {
                mapgl.addSource(id, source[id])
            }
        })

        layers.forEach(layer => {
            if (map.styleIsLoaded() && !mapgl.getLayer(layer.id)) {
                mapgl.addLayer(layer, beforeId)
            }
        })

        if (map.styleIsLoaded()) {
            this._overlayLayerIds = createHighlightOverlay(map, {
                id: this.getId(),
                glLayers: layers,
                beforeId,
            })

            // Replays a highlight/selection recorded before the overlay existed
            if (this._hoverIds.length || this._selectedIds.length) {
                this._syncOverlay()
            }
        }

        if (!this.isVisible()) {
            this.setVisibility(false)
        }

        if (opacity !== undefined) {
            this.setOpacity(opacity)
        }

        if (onClick) {
            this.on('click', onClick)
        }

        if (onRightClick) {
            this.on('contextmenu', onRightClick)
        }

        if (onMouseEnter) {
            this.on('mouseenter', onMouseEnter)
        }

        if (onMouseLeave) {
            this.on('mouseleave', onMouseLeave)
        }

        this.onAdd()
    }

    removeFrom(map) {
        const mapgl = map.getMapGL()
        const source = this.getSource()
        const layers = this.getLayers()
        const { onClick, onRightClick, onMouseEnter, onMouseLeave } =
            this.options

        this.onRemove()

        if (mapgl) {
            clearLayerOpacityCache(mapgl, this.getId())

            layers.forEach(layer => {
                if (mapgl.getLayer(layer.id)) {
                    mapgl.removeLayer(layer.id)
                }
            })

            Object.keys(source).forEach(id => {
                if (mapgl.getSource(id)) {
                    mapgl.removeSource(id)
                }
            })

            removeHighlightOverlay(map, this.getId(), this._overlayLayerIds)
            this._overlayLayerIds = []
        }

        if (onClick) {
            this.off('click', onClick)
        }

        if (onRightClick) {
            this.off('contextmenu', onRightClick)
        }

        if (onMouseEnter) {
            this.off('mouseenter', onMouseEnter)
        }

        if (onMouseLeave) {
            this.off('mouseleave', onMouseLeave)
        }

        this._map = null
    }

    createSource() {
        const id = this.getId()
        const features = this.getFeatures()
        const { buffer, label, labelStyle } = this.options

        this.setSource(id, {
            type: 'geojson',
            data: featureCollection(features),
        })

        if (buffer) {
            this.setSource(
                `${id}-buffer`,
                bufferSource(features, buffer / 1000)
            )
        }

        if (label) {
            this.setSource(`${id}-label`, labelSource(features, labelStyle))
        }
    }

    setVisibility(isVisible) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const value = isVisible ? 'visible' : 'none'
            const layers = this.getLayers()

            if (mapgl && layers) {
                layers.forEach(layer =>
                    mapgl.setLayoutProperty(layer.id, 'visibility', value)
                )

                // Hide the overlay's cloned layers too
                this._overlayLayerIds.forEach(layerId =>
                    mapgl.setLayoutProperty(layerId, 'visibility', value)
                )
            }

            // isInteractive() depends on isVisible(), so a visibility change
            // outside addLayer/removeLayer must invalidate the cache too
            this.getMap()?.invalidateInteractiveLayerIds?.()
        }

        this._isVisible = isVisible
    }

    getId() {
        return this._id
    }

    getMap() {
        return this._map
    }

    getMapGL() {
        return this._map && this._map.getMapGL()
    }

    // Returns true if one of the layers are added to the map
    isOnMap() {
        const map = this.getMap()
        const mapgl = this.getMapGL()
        return Boolean(
            map &&
                map.styleIsLoaded() &&
                this._layers.find(l => mapgl.getLayer(l.id))
        )
    }

    isVisible() {
        return this._isVisible
    }

    isInteractive() {
        return Boolean(
            this._interactiveIds.length && this.isOnMap() && this.isVisible()
        )
    }

    setSource(id, source) {
        this._source[id] = source
    }

    getSource() {
        return this._source
    }

    getInteractiveIds() {
        return this.isInteractive() ? this._interactiveIds : []
    }

    addLayer(layer, layerOptions = {}) {
        const { isInteractive, opacityFactor } = layerOptions

        this._layers.push(layer)

        if (isInteractive) {
            this._interactiveIds.push(layer.id)
        }

        if (opacityFactor) {
            this._opacityFactor = opacityFactor
        }
    }

    getLayers() {
        return this._layers
    }

    hasLayerId(id) {
        return this.getLayers().some(layer => layer.id === id)
    }

    move() {
        const mapgl = this.getMapGL()
        const beforeId = this._map.getBeforeLayerId()

        this.getLayers().forEach(layer => {
            mapgl.moveLayer(layer.id, beforeId)
        })

        // The highlight overlay must stay drawn above these base layers
        // Having just moved the base layers, move the overlay too
        this._overlayLayerIds.forEach(layerId => {
            mapgl.moveLayer(layerId, beforeId)
        })
    }

    getFeatures() {
        return this._features
    }

    // Returns all features having a string or numeric id
    getFeaturesById(id) {
        const features =
            typeof id === 'string'
                ? this._features.filter(f => f.properties.id === id)
                : this._features.filter(f => f.id === id)

        return features.map(f => ({ ...f, source: this.getId() }))
    }

    // Adds integer id for each feature (required by Feature State)
    setFeatures(data = []) {
        // MapLibre properties must be primitives; objects/arrays are not supported
        const sanitizeProps = (props = {}) =>
            Object.fromEntries(
                Object.entries(props)
                    .filter(
                        ([, v]) => v !== undefined && typeof v !== 'function'
                    )
                    .map(([k, v]) => {
                        if (
                            v === null ||
                            typeof v === 'string' ||
                            typeof v === 'number' ||
                            typeof v === 'boolean'
                        ) {
                            return [k, v]
                        }
                        try {
                            return [k, JSON.stringify(v)]
                        } catch {
                            return [k, String(v)]
                        }
                    })
            )
        this._features = data.map((f, i) => ({
            ...f,
            id: i + 1,
            properties: sanitizeProps(f.properties),
        }))
    }

    getImages() {
        return this._images
    }

    getType() {
        return this.options.type
    }

    setImages(images) {
        this._images = images || [
            ...new Set(
                this.getFeatures()
                    .filter(f => f.properties.iconUrl)
                    .map(f => f.properties.iconUrl)
            ),
        ]
    }

    setIndex(index = 0) {
        this.options.index = index

        const map = this.getMap()

        if (map) {
            map.orderOverlays()
        }
    }

    getIndex() {
        return this.options.index || 0
    }

    setOpacity(opacity) {
        const mapgl = this.getMapGL()

        const opacityFactor =
            this._opacityFactor !== undefined ? this._opacityFactor : 1

        if (mapgl) {
            setLayersOpacity(mapgl, this.getId(), opacity * opacityFactor)
        }

        this.options.opacity = opacity
    }

    getBounds() {
        const features = this.getFeatures()

        if (features.length) {
            const [x1, y1, x2, y2] = bbox(featureCollection(features))

            return [
                [x1, y1],
                [x2, y2],
            ]
        }
    }

    isMaxZoom() {
        const mapgl = this.getMapGL()
        return mapgl.getZoom() >= mapgl.getMaxZoom()
    }

    // Hover and selection share one highlight color (last caller wins)

    highlight(ids, color) {
        const map = this.getMap()

        if (!map) {
            return
        }

        this._hoverIds = normalizeIds(ids)
        this._highlightColor = color
        this._syncOverlay()
    }

    select(ids, color) {
        const map = this.getMap()

        if (!map) {
            return
        }

        this._selectedIds = normalizeIds(ids)
        this._highlightColor = color
        this._syncOverlay()
    }

    // `ids` of null/undefined restores each layer's own filter unchanged
    setVisibleIds(ids) {
        const mapgl = this.getMapGL()

        if (!mapgl) {
            return
        }

        this.getLayers().forEach(({ id, filter: baseFilter }) => {
            const filter = ids
                ? baseFilter
                    ? [
                          'all',
                          baseFilter,
                          ['in', ['get', 'id'], ['literal', ids]],
                      ]
                    : ['in', ['get', 'id'], ['literal', ids]]
                : baseFilter ?? null

            mapgl.setFilter(id, filter)
        })

        const dropped = dropHiddenIds(this._hoverIds, this._selectedIds, ids)

        if (dropped) {
            this._hoverIds = dropped.hoverIds
            this._selectedIds = dropped.selectedIds
            this._syncOverlay()
        }
    }

    // Syncs the highlight overlay with the union of hovered/selected ids
    _syncOverlay() {
        const map = this.getMap()

        if (!map) {
            return
        }

        const ids = [...new Set([...this._hoverIds, ...this._selectedIds])]
        const features = ids.flatMap(id => this.getFeaturesById(id))

        updateHighlightOverlay(map, {
            id: this.getId(),
            features,
            color: this._highlightColor,
        })
    }

    // Override if needed in subclass
    filter() {}

    // Override if needed in subclass
    onAdd() {}

    // Override if needed in subclass
    onRemove() {}

    onLoad() {
        this.fire('load')

        if (this.options.onLoad) {
            this.options.onLoad()
        }
    }

    // "Normalise" event before passing back to app
    onClick = evt => this.fire('click', evt)

    // "Normalise" event before passing back to app
    onRightClick() {}

    onMouseMove(evt, feature) {
        const { label, hoverLabel } = this.options

        if (hoverLabel || label) {
            const { properties } = feature

            if (properties.cluster) {
                this._map.hideLabel()
                return
            }

            const content = (hoverLabel || label).replace(
                /\{ *([\w_-]+) *\}/g,
                (str, key) =>
                    properties[key] ??
                    (key === 'value' ? this.locale('Label.NoData') : '')
            )

            this._map.showLabel(content, evt.lngLat)
        } else {
            this._map.hideLabel()
        }
    }

    // Pass layer error to calling app if handler exists
    onError(error) {
        const { onError } = this.options

        if (onError) {
            onError(error)
        } else {
            console.error(error)
        }
    }
}

export default Layer
