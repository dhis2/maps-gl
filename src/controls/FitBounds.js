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

        map.on('layeradd', this.onLayerChange)
        map.on('layerremove', this.onLayerChange)
    }

    onAdd() {
        const mapgl = this._map.getMapGL()
        const label = mapgl._getUIString('FitBoundsControl.ZoomToContent')
        const container = document.createElement('div')

        container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'

        const button = document.createElement('div')

        button.className = 'dhis2-map-ctrl-fitbounds'
        button.type = 'button'
        button.title = label
        button.setAttribute('aria-label', label)

        container.appendChild(button)
        container.addEventListener('click', this.onClick)

        this._container = container

        return container
    }

    onRemove() {
        this._map.on('layeradd', this.onLayerChange)
        this._map.on('layerremove', this.onLayerChange)

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

    onLayerChange = () => {
        if (this._container) {
            this._container.style.display = this._map.getLayersBounds()
                ? 'block'
                : 'none'
        }
    }
}

export default FitBoundsControl
