import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import createLayer from "./layers";

const layerDummy = {
  setOpacity() {}
};

export class Map {
  constructor(el) {
    this.map = new mapboxgl.Map({
      container: el,
      style: {
        version: 8,
        sources: {},
        layers: []
      },
      // bounds: [[-18.7, -34.9], [50.2, 35.9]],
      maxZoom: 18
    });
  }

  fitBounds(bounds) {
    const [a, b] = bounds;

    // TODO: Avoid timeout
    setTimeout(() => {
      this.map.fitBounds([[a[1], a[0]], [b[1], b[0]]]);
    }, 200);
  }

  getContainer() {
    return this.map.getContainer();
  }

  createLayer_test(config) {
    /*
    this.addLayerWhenMapIsReady({
      id: config.pane, // TODO
      type: "fill",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: config.data
        }
      },
      layout: {},
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.8,
        "fill-outline-color": "#333"
      }
    });
    */
  }

  addLayerWhenReady(config) {
    const { id, source, layer, map } = config;

    if (!map) {
      config.map = this.map;
      this.map.addSource(id, source);
      this.map.addLayer(layer);
    }

    return config;
  }

  addLayer(config) {
    if (!config.map) {
      if (this.map.isStyleLoaded()) {
        this.addLayerWhenReady(config);
      } else {
        this.map.once("styledata", () => this.addLayerWhenReady(config));
      }
    } else {
      console.log("Layer already added");
    }
  }

  removeLayer(layer) {
    if (layer.map) {
      this.map.removeLayer(layer.id);
      this.map.removeSource(layer.id);
      layer.map = null;
    }
  }

  hasLayer(layer = {}) {
    return layer.map ? true : false;
  }

  on(a, b, c) {
    // console.log("on", a, b, c);
  }

  addControl() {}

  removeControl() {}

  createLayer(config) {
    // const layer = createLayer(config);
    // console.log("create layer", layer);

    return createLayer(config);
  }

  createPane() {}

  invalidateSize() {
    this.map.resize();
  }

  resize() {
    this.map.resize();
  }
}

export default Map;
