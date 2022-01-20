import Map from './Map'
import supportedLayers from './layers/layerTypes'
import supportedControls from './controls/controlTypes'
import getEarthEngineWorker from './earthengine'
import { getLabelPosition } from './utils/labels'

/**
 *  Wrapper around MapLibre GL JS for DHIS2 Maps
 */

export {
    defaultEarthEngineOptions,
    getEarthEngineOptions,
} from './utils/earthengine'

export const layerTypes = Object.keys(supportedLayers)

export const controlTypes = Object.keys(supportedControls)

export const loadEarthEngineWorker = getEarthEngineWorker

export const poleOfInaccessibility = getLabelPosition

export default Map
