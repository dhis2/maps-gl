import Map from './Map'
import supportedLayers from './layers/layerTypes'
import supportedControls from './controls/controlTypes'
// import getEarthEngineApi from './earthengine/ee_api_loader'
import getEarthEngineWorker from './earthengine/ee_worker_loader'
import { getLabelPosition } from './utils/labels'

/**
 *  Wrapper around MapLibre GL JS for DHIS2 Maps
 */

export const layerTypes = Object.keys(supportedLayers)

export const controlTypes = Object.keys(supportedControls)

// export const loadEarthEngineApi = getEarthEngineApi // TODO: remove
export const loadEarthEngineWorker = getEarthEngineWorker

export const poleOfInaccessibility = getLabelPosition

export default Map
