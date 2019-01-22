import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export class Map {
    constructor(el) {
        this.map = new mapboxgl.Map({
          container: el,
          style: {
            version: 8,
            sources: {
              osmLight: {
                type: 'raster',
                tiles: [
                  '///cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution:
                  '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
              }
            },
            layers: [
              {
                id: 'osmLight',
                type: 'raster',
                source: 'osmLight',
              }
            ]
          },
          bounds: [[-18.7, -34.9], [50.2, 35.9]],
          maxZoom: 17,
        });
    }

    fitBounds(bounds) {
        this.map.fitBounds(bounds);
    }

    getContainer() {
        return this.map.getContainer();
    }

    resize() {
        return this.map.resize();
    }

    createLayer(config) {
        console.log('create layer', config);

        this.addLayerWhenMapIsReady({
            'id': config.pane, // TODO
            'type': 'fill',
            'source': {
                'type': 'geojson',
                'data': {
                    "type": "FeatureCollection",
                    "features": config.data,
                },
            },
            'layout': {},
            'paint': {
                'fill-color': ['get', 'color'],
                'fill-opacity': 0.8,
                'fill-outline-color': '#333',
            }
        });

    }

    addLayerWhenMapIsReady(layer) {
        if (this.map.isStyleLoaded()) {
            this.map.addLayer(layer)
        } else {
            this.map.once('styledata', () => this.map.addLayer(layer)); 
        }
    }

    addLayer() {

    }

    removeLayer() {

    }
};

export default Map;
