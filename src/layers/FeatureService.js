import SphericalMercator from '@mapbox/sphericalmercator'
import FeatureServer from 'mapbox-gl-arcgis-featureserver'
import Layer from './Layer'
import { polygonLayer } from '../utils/layers'

const merc = new SphericalMercator()

// https://github.com/rowanwins/mapbox-gl-arcgis-featureserver
// https://developers.arcgis.com/maplibre-gl-js/layers/add-a-vector-tile-layer/
// https://developers.arcgis.com/documentation/mapping-apis-and-services/data-hosting/tutorials/tools/convert-a-feature-layer-vector-tile/
// https://services3.arcgis.com/BU6Aadhn6tbBEdyk/ArcGIS/rest/services/GRID3_Sierra_Leone_Settlement_Extents/FeatureServer/0
// https://github.com/Esri/arcgis-pbf
// https://community.esri.com/t5/arcgis-api-for-javascript-questions/protocolbuffer-binary-format-pbf-documentation-or/td-p/464691
// https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile.htm
// https://developers.arcgis.com/geoanalytics/core-concepts/vector-tiles/
// https://gis.stackexchange.com/questions/374055/is-it-possible-to-draw-a-pbf-from-an-arcgis-feature-server

// https://github.com/maplibre/maplibre-gl-js/blob/main/src/source/vector_tile_source.ts
class FeatureService extends Layer {
    async addTo(map) {
        this._map = map

        const id = this.getId()
        const { url } = this.options
        const mapgl = this.getMapGL()

        this._service = new FeatureServer(id, mapgl, { url })

        const { style = {} } = this.options
        const { color } = style

        this.addLayer(polygonLayer({ id, color }))

        const layers = this.getLayers()
        const beforeId = map.getBeforeLayerId()

        layers.forEach(layer => {
            if (map.styleIsLoaded() && !mapgl.getLayer(layer.id)) {
                mapgl.addLayer(layer, beforeId)
            }
        })

        this._metadata = await this._service._getServiceMetadata()

        // console.log('FeatureService', id, url, this._service)
    }

    getBounds() {
        if (this._metadata?.extent) {
            const { xmin, ymin, xmax, ymax } = this._metadata.extent
            const bbox = [xmin, ymin, xmax, ymax]

            console.log('getBounds', merc.convert(bbox))

            return merc.convert(bbox)
        }
    }
}

export default FeatureService
