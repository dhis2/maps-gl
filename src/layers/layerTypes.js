import BingLayer from './BingLayer'
import Boundary from './Boundary'
import Choropleth from './Choropleth'
import ClientCluster from './ClientCluster'
import DonutCluster from './DonutCluster'
import EarthEngine from './EarthEngine'
import Events from './Events'
import GeoJson from './GeoJson'
import LayerGroup from './LayerGroup'
import Markers from './Markers'
import ServerCluster from './ServerCluster'
import TileLayer from './TileLayer'
import VectorStyle from './VectorStyle'

export default {
    vectorStyle: VectorStyle, //basemap /externalLayer
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
    geoJson: GeoJson, // tracked entity layer
    group: LayerGroup, // tracked entity layer
}
