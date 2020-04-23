import { FullscreenControl } from 'mapbox-gl'

// Extended to include map name and legend in fullscreen for dashboard maps
class Fullscreen extends FullscreenControl {
    constructor(options = {}) {
        super(options)

        this.options = options
    }

    onAdd(map) {
        const { isSplitView } = this.options

        // Default fullscreen container
        this._container = map.getContainer().parentNode.parentNode

        if (isSplitView) {
            this._container = this._container.parentNode
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

    _changeIcon() {
        this._map.resize()
        super._changeIcon()
    }
}

export default Fullscreen
