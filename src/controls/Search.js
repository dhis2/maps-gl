import './Search.css'

const defaultOptions = {}

// Inspired by https://github.com/lemmingapex/mapbox-gl-generic-geocoder
// https://css-tricks.com/using-svg/
class SearchControl {
    constructor(options) {
        this.options = {
            ...defaultOptions,
            ...options,
        }
    }

    getDefaultPosition() {
        return 'top-right'
    }

    onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'

        this._button = document.createElement('div')
        this._button.className = 'dhis2-maps-ctrl-search'
        this._button.type = 'button'

        this._container.appendChild(this._button)

        return this._container
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container)
        delete this._map
        return this
    }
}

export default SearchControl
