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
                type: "raster",
                tiles: [
                  "///cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
                ],
                tileSize: 256,
                attribution:
                  '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
              }
            },
            layers: [
              {
                id: "osmLight",
                type: "raster",
                source: "osmLight",
                minzoom: 0,
                maxzoom: 22
              }
            ]
          },
          center: [-74.5, 40],
          zoom: 2
        });
    }

    getContainer() {
        return this.map.getContainer();
    }

    resize() {
        return this.map.resize();
    }

    addLayer() {

    }

    removeLayer() {

    }
};

export default Map;
