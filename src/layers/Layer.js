import uuid from 'uuid/v4'
import EventEmitter from 'events'
import bbox from '@turf/bbox'
import { addImages } from '../utils/images'

class Layer extends EventEmitter {
    constructor(options = {}) {
        super()
        this._id = uuid()

        this._source = {}
        this._layers = []
        this._features = []
        this._isVisible = true
        this._interactiveIds = []

        this.options = options
        this.off = this.removeListener // TODO: Why needed?
    }

    async addTo(map) {
        const { onClick, onRightClick } = this.options

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

    isOnMap() {
        const mapgl = this.getMapGL()
        return Boolean(mapgl && mapgl.getLayer(this._id))
    }

    isVisible() {
        return this._isVisible
    }

    isInteractive() {
        return (
            !!this._interactiveIds.length && this.isOnMap() && this.isVisible()
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
        this.getLayers().forEach(layer => mapgl.moveLayer(layer.id))
    }

    getFeatures() {
        return {
            type: 'FeatureCollection',
            features: this._features,
        }
    }

    // Adds integer id for each feature (required by Feature State)
    setFeatures(data = []) {
        this._features = data.map((f, i) => ({ ...f, id: i }))
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

    setIndex(index) {
        this.options.index = index

        this.getMap().orderLayers()
    }

    getIndex() {
        return this.options.index || 0
    }

    setOpacity() {}

    getBounds() {
        const data = this.getFeatures()

        if (data && data.features.length) {
            return bbox(data)
        }
    }

    // "Normalise" event before passing back to app
    onClick(evt) {
        console.log('onClick', evt)
    }

    // "Normalise" event before passing back to app
    onRightClick(evt) {
        console.log('onRightClick', evt)
    }

    // Override if needed in subclass
    onAdd() {}

    // Override if needed in subclass
    onRemove() {}
}

export default Layer
