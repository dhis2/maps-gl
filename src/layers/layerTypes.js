import VectorStyle from './VectorStyle'
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
import GeoJsonUrl from './GeoJsonUrl'
import FeatureService from './ArcGIS/FeatureService'
import LayerGroup from './LayerGroup'

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
    geoJson: GeoJson, // geojson layer
    geoJsonUrl: GeoJsonUrl, // geojson layer from url
    featureService: FeatureService, // ArcGIS feature service
    group: LayerGroup, // tracked entity layer
}
