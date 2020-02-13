import Map from './Map'
import supportedLayers from './layers/layerTypes'
import supportedControls from './controls/controlTypes'
import getEarthEngineApi from './utils/eeapi'

/**
 *  Wrapper around Mapbox GL JS for DHIS2 Maps
 */

export const layerTypes = Object.keys(supportedLayers)

export const controlTypes = Object.keys(supportedControls)

export const loadEarthEngineApi = getEarthEngineApi

export default Map
