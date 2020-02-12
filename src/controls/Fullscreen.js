import { FullscreenControl } from 'mapbox-gl'

// Extended to include map name and legend in fullscreen for dashboard maps
class Fullscreen extends FullscreenControl {
    constructor(options) {
        super(options)

        if (options.isPlugin) {
            this._isPlugin = true
        }
    }

    onAdd(map) {
        if (this._isPlugin) {
            // TODO: This should be done in a cleaner way
            this._container = map.getContainer().parentNode.parentNode
        }

        this._scrollZoomIsDisabled = !map.scrollZoom.isEnabled()

        return super.onAdd(map)
    }

    _onClickFullscreen() {
        // Always enable scroll zoom in fullscreen
        if (this._scrollZoomIsDisabled) {
            this._map.scrollZoom[this._isFullscreen() ? 'disable' : 'enable']()
        }

        super._onClickFullscreen()
    }
}

export default Fullscreen
