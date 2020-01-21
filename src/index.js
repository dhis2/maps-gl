import Map from './Map'
import supportedLayers from './layers/layerTypes'
import supportedControls from './controls/controlTypes'

/**
 *  Wrapper around Mapbox GL JS for DHIS2 Maps
 */

export const layerTypes = Object.keys(supportedLayers)

export const controlTypes = Object.keys(supportedControls)

export default Map
