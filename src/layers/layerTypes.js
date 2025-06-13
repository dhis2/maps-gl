import AzureLayer from './AzureLayer.js'
import BingLayer from './BingLayer.js'
import Boundary from './Boundary.js'
import Choropleth from './Choropleth.js'
import ClientCluster from './ClientCluster.js'
import DonutCluster from './DonutCluster.js'
import EarthEngine from './EarthEngine.js'
import Events from './Events.js'
import GeoJson from './GeoJson.js'
import LayerGroup from './LayerGroup.js'
import Markers from './Markers.js'
import ServerCluster from './ServerCluster.js'
import TileLayer from './TileLayer.js'
import VectorStyle from './VectorStyle.js'

export default {
    vectorStyle: VectorStyle, // basemap / externalLayer
    tileLayer: TileLayer, // basemap / external layer
    wmsLayer: TileLayer, // external layer
    choropleth: Choropleth, // thematic layer
    boundary: Boundary, // boundary layer
    markers: Markers, // facility layer
    events: Events, // event layer
    clientCluster: ClientCluster, // event layer
    donutCluster: DonutCluster, // event layer
    serverCluster: ServerCluster, // event layer
    earthEngine: EarthEngine, // google earth engine layer
    bingLayer: BingLayer, // bing layer basemap
    azureLayer: AzureLayer, // azure layer basemap
    geoJson: GeoJson, // tracked entity layer
    group: LayerGroup, // tracked entity layer
}
