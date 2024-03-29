import { Popup as PopupGL } from 'maplibre-gl'

const defaultOptions = {
    maxWidth: 'auto',
    className: 'dhis2-map-popup',
    closeOnClick: false, // Enabled with restriction below
}

class Popup extends PopupGL {
    constructor(options) {
        super({ ...defaultOptions, ...options })
    }

    addTo(map) {
        const mapgl = map.getMapGL()

        super.addTo(mapgl)

        if (!this._mapInstance) {
            mapgl.on('click', this.onMapClick)
            this._mapInstance = map
        }
    }

    // Remove onClose event if it exists
    clear() {
        if (this._onCloseFunc) {
            this.off('close', this._onCloseFunc)
            this._onCloseFunc = null
        }
        return this
    }

    onClose(onClose) {
        if (typeof onClose === 'function') {
            this._onCloseFunc = onClose
            this.on('close', onClose)
        }
        return this
    }

    // Avoid closing a popup that was just opened
    onMapClick = evt => {
        if (!this._mapInstance.getEventFeature(evt)) {
            this.remove()
        }
    }
}

export default Popup
