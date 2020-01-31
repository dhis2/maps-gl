import TileLayer from './TileLayer'
import Choropleth from './Choropleth'
import Boundary from './Boundary'
import Markers from './Markers'
import Events from './Events'
import ClientCluster from './ClientCluster'
import DonutCluster from './DonutCluster'
import ServerCluster from './ServerCluster'
import EarthEngine from './EarthEngine'
import BingLayer from './BingLayer'
import GeoJson from './GeoJson'
import LayerGroup from './LayerGroup'

export default {
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
