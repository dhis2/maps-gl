import { v4 as uuid } from 'uuid'
import bbox from '@turf/bbox'
import { Evented } from 'maplibre-gl'
import { addImages } from '../utils/images'
import { featureCollection } from '../utils/geometry'
import { bufferSource } from '../utils/buffers'
import { labelSource } from '../utils/labels'
import { setLayersOpacity } from '../utils/opacity'

class Layer extends Evented {
    constructor(options = {}) {
        super()
        this._id = uuid()

        this._source = {}
        this._layers = []
        this._features = []
        this._isVisible = true
        this._interactiveIds = []

        this.options = options

        if (options.data) {
            this.setFeatures(options.data)
        }
    }

    async addTo(map) {
        const { opacity, onClick, onRightClick } = this.options

        this._map = map

        const mapgl = map.getMapGL()
        const images = this.getImages()
        const source = this.getSource()
        const layers = this.getLayers()
        const beforeId = map.getBeforeLayerId()

        if (images) {
            await addImages(mapgl, images)
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

        if (!this.isVisible()) {
            this.setVisibility(false)
        }

        if (opacity) {
            this.setOpacity(opacity)
        }

        if (onClick) {
            this.on('click', onClick)
        }

        if (onRightClick) {
            this.on('contextmenu', onRightClick)
        }

        this.onAdd()
    }

    removeFrom(map) {
        const mapgl = map.getMapGL()
        const source = this.getSource()
        const layers = this.getLayers()
        const { onClick, onRightClick } = this.options

        this.onRemove()

        if (mapgl) {
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
        }

        if (onClick) {
            this.off('click', onClick)
        }

        if (onRightClick) {
            this.off('contextmenu', onRightClick)
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
            }
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
        this._features = data.map((f, i) => ({ ...f, id: i + 1 }))
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

            return [[x1, y1], [x2, y2]]
        }
    }

    isMaxZoom() {
        const mapgl = this.getMapGL()
        return mapgl.getZoom() === mapgl.getMaxZoom()
    }

    // Highlight a layer feature
    highlight(id) {
        const map = this.getMap()

        if (map) {
            map.setHoverState(id ? this.getFeaturesById(id) : null)
        }
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
    onRightClick(evt) {}

    onMouseMove(evt, feature) {
        const { label, hoverLabel } = this.options

        if (hoverLabel || label) {
            const { properties } = feature
            const content = (hoverLabel || label).replace(
                /\{ *([\w_-]+) *\}/g,
                (str, key) => properties[key] || ''
            )

            this._map.showLabel(content, evt.lngLat)
        } else {
            this._map.hideLabel()
        }
    }
}

export default Layer
