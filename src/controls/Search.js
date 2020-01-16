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

        console.log('search control')
    }

    getDefaultPosition() {
        return 'top-right'
    }

    onAdd(map) {
        this._map = map
        this.container = document.createElement('div')
        this.container.className = 'mapboxgl-ctrl dhis2-maps-search'

        const icon = document.createElement('span')
        icon.className =
            'dhis2-maps-search-icon dhis2-maps-search-icon-magnifier'

        this.container.appendChild(icon)

        // map.getContainer().appendChild(this._container)

        return this.container
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container)
        delete this._map
        return this
    }
}

export default SearchControl
