import uuid from 'uuid/v4'
import bbox from '@turf/bbox'
import { Evented } from 'mapbox-gl'
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
        const source = await this.getSource()
        const layers = this.getLayers()

        if (images) {
            await addImages(mapgl, images)
        }

        Object.keys(source).forEach(id => mapgl.addSource(id, source[id]))
        layers.forEach(layer => mapgl.addLayer(layer))

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

        layers.forEach(layer => mapgl.removeLayer(layer.id))
        Object.keys(source).forEach(id => mapgl.removeSource(id))

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
        const mapgl = this.getMapGL()

        return Boolean(mapgl && this._layers.find(l => mapgl.getLayer(l.id)))
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

    addLayer(layer, isInteractive) {
        this._layers.push(layer)

        if (isInteractive) {
            this._interactiveIds.push(layer.id)
        }
    }

    getLayers() {
        return this._layers
    }

    hasLayerId(id) {
        return this.getLayers().some(layer => layer.id === id)
    }

    moveToTop() {
        const mapgl = this.getMapGL()

        this.getLayers().forEach(layer => {
            mapgl.moveLayer(layer.id)
        })
    }

    getFeatures() {
        return this._features
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
        this._images = images
    }

    setIndex(index = 0) {
        this.options.index = index

        const map = this.getMap()

        if (map) {
            map.orderLayers()
        }
    }

    getIndex() {
        return this.options.index || 0
    }

    setOpacity(opacity) {
        setLayersOpacity(this.getMapGL(), this.getId(), opacity)
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

    // Override if needed in subclass
    onAdd() {}

    // Override if needed in subclass
    onRemove() {}

    // "Normalise" event before passing back to app
    onClick = evt => this.fire('click', evt)

    // "Normalise" event before passing back to app
    onRightClick(evt) {

    }

    onMouseMove(evt, feature) {
        const { label, hoverLabel } = this.options

        if (hoverLabel || label) {
            const { properties } = feature
            const content = (hoverLabel || label).replace(
                /\{ *([\w_-]+) *\}/g,
                (str, key) => properties[key]
            )
            const { lngLat, point } = evt

            this._map.showLabel(content, lngLat)
        }
    }
}

export default Layer
