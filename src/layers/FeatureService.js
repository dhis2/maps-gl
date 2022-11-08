import FeatureServer from 'mapbox-gl-arcgis-featureserver'
import Layer from './Layer'

// https://github.com/rowanwins/mapbox-gl-arcgis-featureserver
class FeatureService extends Layer {
    async addTo(map) {
        this._map = map

        const id = this.getId()
        const { url } = this.options
        const mapgl = this.getMapGL()

        this._service = new FeatureServer(id, mapgl, { url })

        mapgl.addLayer({
            id: `${id}-fill`,
            source: id,
            type: 'fill',
            paint: {
                'fill-opacity': 1,
                'fill-color': '#B42222',
            },
        })

        console.log('FeatureService', id, url, this._service)
    }

    getBounds() {
        // console.log('getBounds', this._service._maxExtent)
    }

    // onAdd() {}
}

export default FeatureService
