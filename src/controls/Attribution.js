import { AttributionControl } from 'maplibre-gl'
import './Attribution.css'

const scaleControlWidth = 130

// Extended to force compact mode for attributions covering the scale bar
class Attribution extends AttributionControl {
    _updateAttributions() {
        super._updateAttributions()

        if (this._isLongAttribution()) {
            if (this._compact === undefined) {
                this._compact = true
                this._updateCompact()
            }

            this._updateCompactMinimize()
        }
    }

    _isLongAttribution() {
        const attWidth = this._container.clientWidth
        const mapWidth = this._map.getContainer().clientWidth

        return attWidth && mapWidth && attWidth > mapWidth - scaleControlWidth
    }
}

export default Attribution
