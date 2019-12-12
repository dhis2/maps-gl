import TileLayer from './TileLayer'
import Choropleth from './Choropleth'
import Boundary from './Boundary'
import Markers from './Markers'
import Events from './Events'
import ClientCluster from './ClientCluster'
import ServerCluster from './ClientCluster'
import EarthEngine from './EarthEngine'

export default {
    tileLayer: TileLayer, // basemap / external layer
    wmsLayer: TileLayer, // external layer
    choropleth: Choropleth, // thematic layer
    boundary: Boundary, // boundary layer
    markers: Markers, // facility layer
    events: Events, // event layer
    clientCluster: ClientCluster, // event layer
    serverCluster: ServerCluster, // event layer
    earthEngine: EarthEngine, // google earth engine layer
}
