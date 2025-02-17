// Based on https://github.com/Pitbi/mapbox-gl-multitouch (no longer maintained)
class MultiTouch {
    constructor() {
        this.state = {
            panStart: { x: 0, y: 0 },
            scale: 1,
        }
        this.touchStart = this.touchStart.bind(this)
        this.touchMove = this.touchMove.bind(this)
    }

    touchStart(event) {
        if (event.touches.length !== 2) {
            return
        }

        event.stopImmediatePropagation()
        event.preventDefault()

        let x = 0
        let y = 0

        ;[].forEach.call(event.touches, (touch) => {
            x += touch.screenX
            y += touch.screenY
        })

        this.state.panStart.x = x / event.touches.length
        this.state.panStart.y = y / event.touches.length
    }

    touchMove(event) {
        if (event.touches.length !== 2) {
            return
        }

        if (this.state.scale === event.scale) {
            event.stopImmediatePropagation()
            event.preventDefault()
        }

        this.state.scale = event.scale

        let x = 0
        let y = 0

        ;[].forEach.call(event.touches, (touch) => {
            x += touch.screenX
            y += touch.screenY
        })

        const movex = x / event.touches.length - this.state.panStart.x
        const movey = y / event.touches.length - this.state.panStart.y

        this.state.panStart.x = x / event.touches.length
        this.state.panStart.y = y / event.touches.length

        this.map.panBy([movex / -1, movey / -1], { animate: false })
    }

    onAdd(map) {
        this.map = map
        this._container = document.createElement('div')

        const container = map.getContainer()

        container.addEventListener('touchstart', this.touchStart, false)
        container.addEventListener('touchmove', this.touchMove, false)

        if ('ontouchstart' in document.documentElement) {
            map.dragPan.disable()
        }

        return this._container
    }

    onRemove() {
        const container = this.map.getContainer()

        container.removeEventListener('touchstart', this.touchStart)
        container.removeEventListener('touchmove', this.touchMove)

        if ('ontouchstart' in document.documentElement) {
            this.map.dragPan.enable()
        }

        this.map = undefined
    }
}

export default MultiTouch
