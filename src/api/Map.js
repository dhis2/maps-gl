import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import EventEmitter from "events";
// import createLayer from "./layers";
import getControl from "./controls";
import Layer from "./layers/Layer";
import TileLayer from "./layers/TileLayer";
import Choropleth from "./layers/Choropleth";

export class Map extends EventEmitter {
  constructor(el) {
    super();
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

    this.layerConfigs = [];

    this.map.on("click", evt => this.onClick(evt));
    this.map.on("contextmenu", evt => this.onContextMenu(evt));

    // const tileLayer = new TileLayer();
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
            map.loadImage(
              "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png",
              (error, img) => {
                if (error) reject(error);
                map.addImage(image.url, img);
                resolve(img);
              }
            );
          })
      )
    );
  }

  async addLayerWhenReady(layer) {
    if (!layer.isOnMap()) {
      layer.addTo(this.map);
    }

    //const { id, sources, layers, images, map } = layerConfig;
    //if (!map) {
    /*
      layerConfig.map = this.map;

      if (images) {
        await this.loadImages(images);
      }

      if (id && sources && layers) {
        Object.keys(sources).forEach(id => this.map.addSource(id, sources[id]));
        layers.forEach(layer => this.map.addLayer(layer));
      }

      this.layerConfigs.push(layerConfig);
      */
    // }
    // return layerConfig; // TODO: This is async
  }

  addLayer(layer) {
    if (this.map.isStyleLoaded()) {
      this.addLayerWhenReady(layer);
    } else {
      this.map.once("styledata", () => this.addLayerWhenReady(layer));
    }
  }

  removeLayer(layerConfig) {
    const { id, layers, sources, map } = layerConfig;

    if (map) {
      layers.forEach(layer => this.map.removeLayer(layer.id));
      Object.keys(sources).forEach(id => this.map.removeSource(id));
      layerConfig.map = null;
    }

    // TODO: Remove layerConfigs
  }

  hasLayer(layer = {}) {
    return layer.map ? true : false;
  }

  /*
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
  */

  /*
  off(type, listener, scope) {
    console.log("off", type, listener, scope);
  }
  */

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
    switch (config.type) {
      case "tileLayer":
        return new TileLayer(config);
      case "choropleth":
        return new Choropleth(config);
      default:
        console.log("Unknown layer type", config.type);
        return new Layer();
    }
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

  onClick(evt) {
    const feature = this.getEventFeature(evt);
    if (feature) {
      console.log("feature", feature.layer.id, this.layerConfigs);
    } else {
      console.log("no feature", evt);
    }
  }

  onContextMenu(evt) {
    const feature = this.getEventFeature(evt);
    console.log("onContextMenu", evt.point, feature);
  }

  getEventFeature(evt) {
    return this.map.queryRenderedFeatures(evt.point, {
      // layers: this.props.layers // Contains visible layers
    })[0]; // [0] returns topmost
  }
}

export default Map;
