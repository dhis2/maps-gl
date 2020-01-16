/**
 *  Wrapper around Mapbox GL JS for DHIS2 Maps
 */

import Map from './Map'
import types from './layers/layerTypes'

export const layerTypes = Object.keys(types)

export default Map
