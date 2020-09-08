import { FullscreenControl } from 'mapbox-gl'

// Extended to include map name and legend in fullscreen for dashboard maps
class Fullscreen extends FullscreenControl {
    constructor(options = {}) {
        super(options)

        this.options = options
    }

    addTo(map) {
        this._eventMap = map;
        this._map = map.getMapGL()

        this._map.addControl(this)
    }

    onAdd(map) {
        const { isSplitView } = this.options

        // Default fullscreen container
        this._container = map.getContainer().parentNode.parentNode

        if (isSplitView) {
            this._container = this._container.parentNode
        }

        return super.onAdd(map)
    }

    _onClickFullscreen() {
        this._eventMap.fire('fullscreenchange', { isFullscreen: !this._isFullscreen() });

        super._onClickFullscreen()
    }

    _changeIcon() {
        this._map.resize()
        super._changeIcon()
    }
}



export default Fullscreen
