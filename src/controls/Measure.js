const defaultOptions = {}

class MeasureControl {
    constructor(options) {
        this.options = {
            ...defaultOptions,
            ...options,
        }

        console.log('measure control')
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

export default MeasureControl
