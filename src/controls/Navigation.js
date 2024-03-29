import { NavigationControl } from 'maplibre-gl'

const defaultOptions = {
    visualizePitch: true,
}

// Extended to reset pitch
class Navigation extends NavigationControl {
    constructor(options = {}) {
        super({ ...defaultOptions, ...options })
    }
}

export default Navigation
