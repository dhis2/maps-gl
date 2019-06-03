import mapboxgl from 'mapbox-gl'
import Layer from './Layer'

// https://github.com/mapbox/mapbox-gl-js/projects/2
// https://github.com/mapbox/mapbox-gl-js/blob/master/src/source/source_cache.js
// https://github.com/mapbox/mapbox-gl-js/blob/master/src/render/draw_raster.js
// https://github.com/mapbox/mapbox-gl-js/blob/master/src/source/tile.js
// https://github.com/mapbox/mapbox-gl-js/pull/2667
// https://github.com/mapbox/mapbox-gl-js/issues/2120
// https://github.com/mapbox/mapbox-gl-js/issues/3051
// https://github.com/mapbox/mapbox-gl-js/issues/3326

class ServerCluster extends Layer {
    constructor(options) {
        super(options)
        this.createSource()
    }

    createSource() {
        const id = this.getId()

        console.log('Server cluster', id)

        this.setSource(id, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [],
            },
        })
    }

    onAdd() {
        const mapgl = this.getMapGL()
        // const source = mapgl.getSource(this.getId())
        // const style = mapgl.getStyle()

        mapgl.showTileBoundaries = true

        console.log('sourceCaches', mapgl.painter.style.sourceCaches)

        mapgl.on('moveend', () => {
            const sourceCache = mapgl.painter.style.sourceCaches[this.getId()]

            console.log('sourceCache', sourceCache._tiles)
        })

        // https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/
        /*
        const customLayer = {
            id: 'test',
            type: 'custom',
            render: (gl, matrix) => console.log('render', gl, matrix),
            onAdd: (map, gl) => console.log('onAdd', map, gl),
        }

        mapgl.addLayer(customLayer);

        const layer = mapgl.getLayer('test');

        console.log('Custom layer', layer); // .getVisibleCoordinates
        */
    }
}

export default ServerCluster
