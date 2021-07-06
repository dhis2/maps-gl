import { Popup } from 'mapbox-gl'
import './Label.css'

const defaultOptions = {
    closeButton: false,
    closeOnClick: false,
    anchor: 'left',
    offset: [10, 0],
    className: 'dhis2-map-label',
}

// Extends Mapbox GL Popup to create a label used for hover/tooltip
// Extends https://github.com/mapbox/mapbox-gl-js/blob/master/src/ui/popup.js
class Label extends Popup {
    constructor(options) {
        super({ ...defaultOptions, ...options })
    }

    // Position label to the left/right of the cursor
    _update(cursor) {
        const map = this._map

        if (map) {
            const pos =
                this._trackPointer && cursor
                    ? cursor
                    : map.project(this._lngLat)
            const anchor =
                pos.x < map.getContainer().offsetWidth / 2 ? 'left' : 'right'
            this.options.anchor = anchor
            this.options.offset[0] = anchor === 'left' ? 10 : -10
        }

        super._update(cursor)
    }
}

export default Label
