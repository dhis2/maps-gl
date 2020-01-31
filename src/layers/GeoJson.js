import Layer from './Layer'

// https://docs.mapbox.com/mapbox-gl-js/example/multiple-geometries/
class GeoJson extends Layer {
    constructor(options) {
        super(options)

        console.log('GeoJson')
    }
}

export default GeoJson
