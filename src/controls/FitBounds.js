import './FitBounds.css'

class FitBoundsControl {
    constructor(options) {
        this.options = options
    }

    getDefaultPosition() {
        return 'top-right'
    }

    addTo(map) {
        this._map = map
        map.getMapGL().addControl(this)
    }

    onAdd() {
        const container = document.createElement('div')

        container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'

        const button = document.createElement('div')

        button.className = 'dhis2-maps-ctrl-fitbounds'
        button.type = 'button'

        container.appendChild(button)
        container.addEventListener('click', this.onClick)

        this._container = container

        return container
    }

    onRemove() {
        this._container.removeEventListener('click', this.onClick)
        this._container.parentNode.removeChild(this._container)

        delete this._container
        delete this._button
        delete this._map
        delete this._mapgl
    }

    onClick = () => {
        const bounds = this._map.getLayersBounds()

        if (bounds) {
            this._map.fitBounds(bounds)
        }
    }
}

export default FitBoundsControl
