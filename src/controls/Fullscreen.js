import { FullscreenControl } from 'mapbox-gl'

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

        return super.onAdd(map)
    }
}

export default Fullscreen
