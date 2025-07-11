import supportedControls from './controls/controlTypes.js'
import {
    getEarthEngineWorker,
    createWorkerUrl,
    EarthEngineWorker,
} from './earthengine/index.js'
import supportedLayers from './layers/layerTypes.js'
import Map from './Map.js'
import { getLabelPosition } from './utils/labels.js'

/**
 *  Wrapper around MapLibre GL JS for DHIS2 Maps
 */

export const layerTypes = Object.keys(supportedLayers)

export const controlTypes = Object.keys(supportedControls)

export const loadEarthEngineWorker = getEarthEngineWorker
export const createEarthEngineWorkerUrl = createWorkerUrl
export const EarthEngineWorkerClass = EarthEngineWorker

export const poleOfInaccessibility = getLabelPosition

export default Map
