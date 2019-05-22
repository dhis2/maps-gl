import tileLayer from './TileLayer'
import choropleth from './Choropleth'
import boundary from './Boundary'
import markers from './Markers'
import dots from './Dots'
import clientCluster from './ClientCluster'
import earthEngine from './EarthEngine'

export default {
    tileLayer, // CartoDB basemap
    choropleth, // Thematic layer
    boundary, // Boundary layer
    markers, // Facility layer
    dots, // Event layer without clustering
    clientCluster, // Event layer
    earthEngine, // Google Earth Engine layer
}
