const defaultOptions = {}

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
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-search'

        map.getContainer().appendChild(this._container)

        return this._container
    }

    onRemove() {
        map.getContainer().removeChild(this._container)
        delete this._map
    }
}

export default SearchControl
