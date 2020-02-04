import { Evented } from 'mapbox-gl'
import { getBoundsFromLayers } from '../utils/geometry'

class LayerGroup extends Evented {
    constructor(options) {
        super()

        this.options = options || {}
        this._layers = []
        this._layerConfigs = []
    }

    addTo(map) {
        this._map = map
        const { opacity } = this.options

        this._layerConfigs.forEach(config => {
            const layer = this._map.createLayer({
                opacity,
                ...config,
            })

            layer.addTo(map)

            this._layers.push(layer)
        })
    }

    removeFrom(map) {
        this._layers.some(layer => layer.removeFrom(map))
        this._layers = []
        this._layerConfigs = []
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

    setOpacity(opacity) {
        this._layers.forEach(layer => layer.setOpacity(opacity))
    }

    moveToTop() {
        this._layers.forEach(layer => layer.moveToTop())
    }

    hasLayerId(id) {
        return this._layers.some(layer =>
            layer.getLayers().some(layer => layer.id === id)
        )
    }

    onClick = evt => {
        const { feature } = evt

        if (feature) {
            const { id } = feature.layer
            const layer = this._layers.find(l => l.hasLayerId(id))

            if (layer) {
                layer.fire('click', evt)
            }
        }
    }
}

export default LayerGroup
