import './FitBounds.css'

const defaultOptions = {}

// https://github.com/mapbox/mapbox-gl-js/blob/master/src/css/mapbox-gl.css
class FitBoundsControl {
    constructor(options) {
        this.options = {
            ...defaultOptions,
            ...options,
        }
    }

    getDefaultPosition() {
        return 'top-right'
    }

    getLayersBounds() {
        console.log('getLayersBounds', this._map)
    }

    onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'

        this._button = document.createElement('div')
        this._button.className = 'dhis2-maps-ctrl-fitbounds'
        this._button.type = 'button'

        this._container.appendChild(this._button)

        this._container.addEventListener('click', this.onClick)

        return this._container
    }

    onRemove() {
        this._container.removeEventListener('click', this.onClick)

        map.getContainer().removeChild(this._container)
        delete this._map
    }

    onClick = () => {
        console.log('CLICK!')

        const bounds = this.getLayersBounds()

        if (bounds) {
            this._map.fitBounds(bounds)
        }
    }
}

export default FitBoundsControl
