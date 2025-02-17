import supportedControls from './controls/controlTypes'
import getEarthEngineWorker from './earthengine'
import supportedLayers from './layers/layerTypes'
import Map from './Map'
import { getLabelPosition } from './utils/labels'

/**
 *  Wrapper around MapLibre GL JS for DHIS2 Maps
 */

export const layerTypes = Object.keys(supportedLayers)

export const controlTypes = Object.keys(supportedControls)

export const loadEarthEngineWorker = getEarthEngineWorker

export const poleOfInaccessibility = getLabelPosition

export default Map
