import { setRTLTextPlugin } from 'maplibre-gl'

// Official Mapbox/MapLibre plugin for Arabic shaping and right-to-left reordering.
const DEFAULT_RTL_TEXT_PLUGIN_URL =
    'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js'

let requested = false

export const loadRTLTextPlugin = (url = DEFAULT_RTL_TEXT_PLUGIN_URL) => {
    if (requested) {
        return
    }

    requested = true

    try {
        setRTLTextPlugin(url, true)
    } catch (error) {
        console.error('Failed to set RTL text plugin', error)
    }
}
