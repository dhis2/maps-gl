import { setRTLTextPlugin } from 'maplibre-gl'

// Plugin for Arabic shaping and right-to-left reordering, copied on install
// from @mapbox/mapbox-gl-rtl-text (see scripts/prepare-vendor-files.js)
const RTL_TEXT_PLUGIN_URL = new URL(
    '../vendor/mapbox-gl-rtl-text.js',
    import.meta.url
).href

let requested = false

export const loadRTLTextPlugin = async () => {
    if (requested) {
        return
    }

    requested = true

    // Only catches setup errors: MapLibre loads the plugin when first needed
    try {
        await setRTLTextPlugin(RTL_TEXT_PLUGIN_URL, true)
    } catch (error) {
        console.error('Failed to set RTL text plugin', error)
    }
}
