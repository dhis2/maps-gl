import { Popup as PopupGL } from 'mapbox-gl'
import uuid from 'uuid/v4'

const defaultOptions = {
    maxWidth: 'auto',
    className: 'dhis2-map-popup',
}

class Popup extends PopupGL {
    constructor(options) {
        super({ ...defaultOptions, ...options })

        this.on('close', this._onPopupClose)
    }

    /*
    addTo(map) {
        super.addTo(map)
    }
    */

    onClose(onClose) {
        console.log('onClose')

        if (typeof onClose === 'function') { 
            this._id = uuid()
            this.once('close', this._onPopupClose(this._id, onClose))
        }

        /*
        console.log('onClose', isOpen)

        this.once('close', this._onCloseCallback)
        */

        return this

    }

    _onPopupClose = (uid, onClose) => () => {
        console.log('_onPopupClose', uid, this._id, onClose);

        onClose()

    }

    remove(isUserActivated) {
        if (isUserActivated) {
            // this.removeOnClose()

            if (this.listens('close')) {
                console.log('THERE ARE CLOSE LISTENERS THAT SHOULD NOT BE CALLED');
            }
        } else {
            super.remove()
        }
        
    }


    /*
    addTo(map) {
        this.removeOnClose()
        super.addTo(map)
    }

    // Make sure onlu one onClose callback is attached
    onClose(onClose) {
        if (typeof onClose === 'function') { 
            this.removeOnClose()



            // this.once('close', this._onCloseCallback)
            this._onCloseCallback = onClose

        }
        return this
    }

    remove(isUserActivated) {
        if (isUserActivated) {
            this.removeOnClose()
        }
        super.remove()
    }

    removeOnClose() {
        if (this._onCloseCallback) {
            this.off('close', this._onCloseCallback)
            this._onCloseCallback = null
        }
    }
    */
}

export default Popup
