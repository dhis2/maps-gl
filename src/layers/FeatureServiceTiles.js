import SphericalMercator from '@mapbox/sphericalmercator'
import Layer from './Layer'
import { polygonLayer } from '../utils/layers'

const merc = new SphericalMercator({ size: 512 })

console.log('merc.bbox', merc.bbox(119, 122, 8, false, '900913'))

// https://gis.stackexchange.com/questions/287610/how-to-find-layer-names-within-vector-tiles-without-tilejson-or-the-mbtiles-fi

// https://developers.arcgis.com/rest/services-reference/enterprise/output-formats.htm
// https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer-.htm

// https://services3.arcgis.com/BU6Aadhn6tbBEdyk/ArcGIS/rest/services/GRID3_Sierra_Leone_Settlement_Extents/FeatureServer/0/query?f=pbf&geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%2C%22wkid%22%3A4326%7D%2C%22xmin%22%3A-11.6015625%2C%22ymin%22%3A8.059229627200201%2C%22xmax%22%3A-11.25%2C%22ymax%22%3A8.407168163601074%7D&where=1%3D1&outFields=*&outSR=4326&returnZ=false&returnM=false&precision=8&quantizationParameters=%7B%22extent%22%3A%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%2C%22wkid%22%3A4326%7D%2C%22xmin%22%3A-11.6015625%2C%22ymin%22%3A8.059229627200201%2C%22xmax%22%3A-11.25%2C%22ymax%22%3A8.407168163601074%7D%2C%22tolerance%22%3A0.00011412662864846256%2C%22mode%22%3A%22view%22%7D&resultType=tile&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryEnvelope&inSR=4326
// https://services3.arcgis.com/BU6Aadhn6tbBEdyk/ArcGIS/rest/services/GRID3_Sierra_Leone_Settlement_Extents/FeatureServer/0/query?f=pbf&geometry={"spatialReference":{"latestWkid":4326,"wkid":4326},"xmin":-11.6015625,"ymin":8.059229627200201,"xmax":-11.25,"ymax":8.407168163601074}&where=1=1&outFields=*&outSR=4326&returnZ=false&returnM=false&precision=8&quantizationParameters={"extent":{"spatialReference":{"latestWkid":4326,"wkid":4326},"xmin":-11.6015625,"ymin":8.059229627200201,"xmax":-11.25,"ymax":8.407168163601074},"tolerance":0.00011412662864846256,"mode":"view"}&resultType=tile&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryEnvelope&inSR=4326

// https://services3.arcgis.com/BU6Aadhn6tbBEdyk/ArcGIS/rest/services/GRID3_Sierra_Leone_Settlement_Extents/FeatureServer/0/query?f=pbf&geometry=-1408887.3053549863,939258.2035709843,-1252344.271426987,1095801.2374989837&maxRecordCountFactor=4&resultOffset=0&resultRecordCount=8000&where=1=1&orderByFields=OBJECTID&outFields=OBJECTID&quantizationParameters={"extent":{"xmin":-1408887.3053549863,"ymin":939258.2035709843,"xmax":-1252344.271426987,"ymax":1095801.2374989837},"mode":"view","originPosition":"upperLeft","tolerance":305.74811314062526}&resultType=tile&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryEnvelope&defaultSR=102100

class FeatureService extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    createSource() {
        const id = this.getId()
        const { url } = this.options

        this.setSource(id, {
            type: 'vector',
            tiles: [`${url}/{z}/{x}/{y}.pbf`],
        })
    }

    createLayers() {
        const id = this.getId()
        const { style = {} } = this.options
        const { color } = style

        this.addLayer(polygonLayer({ id, color, sourceLayer: '' }))
    }
}

export default FeatureService
