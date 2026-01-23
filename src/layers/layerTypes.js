import AzureLayer from './AzureLayer.js'
import BingLayer from './BingLayer.js'
import Boundary from './Boundary.js'
import Choropleth from './Choropleth.js'
import ClientCluster from './ClientCluster.js'
import DonutCluster from './DonutCluster.js'
import EarthEngine from './EarthEngine.js'
import Events from './Events.js'
import GeoJson from './GeoJson.js'
import Heat from './Heat.js'
import LayerGroup from './LayerGroup.js'
import Markers from './Markers.js'
import ServerCluster from './ServerCluster.js'
import TileLayer from './TileLayer.js'
import VectorStyle from './VectorStyle.js'

export default {
    azureLayer: AzureLayer, // azure layer basemap
    bingLayer: BingLayer, // bing layer basemap
    boundary: Boundary, // boundary layer
    choropleth: Choropleth, // thematic layer
    clientCluster: ClientCluster, // event layer
    donutCluster: DonutCluster, // event layer
    earthEngine: EarthEngine, // google earth engine layer
    events: Events, // event layer
    geoJson: GeoJson, // tracked entity layer
    group: LayerGroup, // tracked entity layer
    heat: Heat, // event layer
    markers: Markers, // facility layer
    serverCluster: ServerCluster, // event layer
    tileLayer: TileLayer, // basemap / external layer
    vectorStyle: VectorStyle, // basemap / externalLayer
    wmsLayer: TileLayer, // external layer
}
