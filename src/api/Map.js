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

  // TODO: Move to separate file
  async loadImages(images = []) {
    const map = this.map;
    Promise.all(
      images.map(
        image =>
          new Promise((resolve, reject) => {
            console.log("promise", image.url);
            map.loadImage(
              "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png",
              (error, img) => {
                if (error) reject(error);
                map.addImage(image.url, img);
                console.log("resolved", image.url);
                resolve(img);
              }
            );
          })
      )
    );
  }

  async addLayerWhenReady(config) {
    const { id, sources, layers, images, map } = config;

    if (!map) {
      config.map = this.map;

      if (images) {
        const test = await this.loadImages(images);
        console.log("promise", test);
      }

      if (id && sources && layers) {
        Object.keys(sources).forEach(id => this.map.addSource(id, sources[id]));
        layers.forEach(layer => this.map.addLayer(layer));
      }
    }

    return config; // TODO: This is async
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
    const { id, layers, sources, map } = layerConfig;

    if (map) {
      layers.forEach(layer => this.map.removeLayer(layer.id));
      Object.keys(sources).forEach(id => this.map.removeSource(id));
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
