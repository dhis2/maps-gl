import fetchJsonp from 'fetch-jsonp'
import { getParamString } from './utils'

export const DEFAULT_WMS_VERSION = '1.1.1'

export const getMapUrl = (baseUrl, params) =>
    `${baseUrl}?${getParamString({
        service: 'WMS',
        version: DEFAULT_WMS_VERSION,
        request: 'GetMap',
        srs: 'EPSG:3857',
        transparent: true,
        width: 256,
        height: 256,
        bbox: '{bbox-epsg-3857}', // Translated by Mapbox GL JS
        ...params,
    })}`

// https://gis.stackexchange.com/questions/79201/lat-long-values-in-a-wms-getfeatureinfo-request
// https://github.com/openlayers/openlayers/blob/main/src/ol/source/ImageWMS.js#L163
// https://docs.geoserver.org/stable/en/user/services/wms/reference.html
// https://enterprise.arcgis.com/en/server/latest/publish-services/linux/customizing-a-wms-getfeatureinfo-response.htm
export const getFeatureInfoUrl = ({ coordinate, layers }) => {
    const [lng, lat] = coordinate
    const bbox = [[lng - 0.1], [lat - 0.1], [lng + 0.1], [lat + 0.1]]

    const params = {
        service: 'WMS',
        version: DEFAULT_WMS_VERSION,
        request: 'GetFeatureInfo',
        layers: layers,
        query_layers: layers,
        feature_count: 10,
        info_format: 'text/javascript',
        format_options: 'callback:handleJson',
        SrsName: 'EPSG:4326',
        width: 101,
        height: 101,
        x: 50,
        y: 50,
        bbox: bbox.join(),
    }
}
