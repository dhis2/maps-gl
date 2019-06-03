import tileLayer from './TileLayer'
import choropleth from './Choropleth'
import boundary from './Boundary'
import markers from './Markers'
import events from './Events'
import clientCluster from './ClientCluster'
import serverCluster from './ServerCluster'
import earthEngine from './EarthEngine'

export default {
    tileLayer, // CartoDB basemap
    choropleth, // Thematic layer
    boundary, // Boundary layer
    markers, // Facility layer
    events, // Event layer without clustering
    clientCluster, // Event layer
    serverCluster, // Event layer
    earthEngine, // Google Earth Engine layer
}
