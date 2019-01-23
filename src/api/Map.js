import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import createLayer from "./layers";
import getControl from "./controls";

export class Map {
  constructor(el) {
    this.map = new mapboxgl.Map({
      container: el,
      style: {
        version: 8,
        sources: {},
        layers: [],
        glyphs: "http://fonts.openmaptiles.org/{fontstack}/{range}.pbf" // TODO: Host ourseleves
      },
      maxZoom: 18
    });
  }

  fitBounds(bounds) {
    // console.log("fitBounds", bounds);
    const [a, b] = bounds;

    // TODO: Avoid timeout
    setTimeout(() => {
      this.map.fitBounds([[a[1], a[0]], [b[1], b[0]]]);
    }, 200);
  }

  getContainer() {
    return this.map.getContainer();
  }

  addLayerWhenReady(config) {
    const { id, source, layer, layers, images, map } = config;

    if (images) {
      images.forEach(image => {
        this.map.loadImage(image.url, (error, img) => {
          if (error) throw error;
          console.log("#", image, img);
          // map.addImage("cat", image);
        });
      });
    }

    if (!map && id && source && (layer || layers)) {
      config.map = this.map;
      this.map.addSource(id, source);
      if (layer) {
        this.map.addLayer(layer);
      } else {
        layers.forEach(layer => this.map.addLayer(layer));
      }
    }

    return config;
  }

  addLayer(config = {}) {
    if (!config.map) {
      if (this.map.isStyleLoaded()) {
        this.addLayerWhenReady(config);
      } else {
        this.map.once("styledata", () => this.addLayerWhenReady(config));
      }
    }
  }

  removeLayer(layerConfig) {
    const { id, layers, map } = layerConfig;

    if (map) {
      if (layers) {
        layers.forEach(layer => this.map.removeLayer(layer.id));
      } else {
        this.map.removeLayer(id);
      }

      this.map.removeSource(id);
      layerConfig.map = null;
    }
  }

  hasLayer(layer = {}) {
    return layer.map ? true : false;
  }

  on(type, listener, scope) {
    if (type === "contextmenu") {
      this.map.on(type, evt => {
        evt.latlng = evt.lngLat;
        listener.call(scope, evt);
      });
    } else {
      console.log("on", type, listener, scope);
    }
  }

  off(type, listener, scope) {
    console.log("off", type, listener, scope);
  }

  addControl(control) {
    const mapboxControl = getControl(control);

    if (mapboxControl) {
      this.map.addControl(mapboxControl);
    }
  }

  removeControl(control) {
    console.log("removeControl", control);
  }

  createLayer(config) {
    return createLayer(config);
  }

  createPane() {}

  openPopup(popup) {
    console.log("openPopup", popup);
  }

  invalidateSize() {
    this.map.resize();
  }

  resize() {
    this.map.resize();
  }
}

export default Map;
