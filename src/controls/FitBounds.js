const defaultOptions = {}

// https://github.com/mapbox/mapbox-gl-js/blob/master/src/css/mapbox-gl.css
class FitBoundsControl {
    constructor(options) {
        this.options = {
            ...defaultOptions,
            ...options,
        }

        console.log('fit bounds control')
    }

    getDefaultPosition() {
        return 'top-right'
    }

    onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'

        this._button = document.createElement('div')
        this._button.className = 'dhis2-maps-ctrl-fitbounds'
        this._button.type = 'button'

        this._container.appendChild(this._button)

        return this._container
    }

    onRemove() {
        map.getContainer().removeChild(this._container)
        delete this._map
    }
}

export default FitBoundsControl
