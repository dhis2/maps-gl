import uuid from "uuid/v4";
import EventEmitter from "events";
import bbox from "@turf/bbox";
import { addImages } from "../utils/images";

class Layer extends EventEmitter {
  constructor() {
    super();
    this._id = uuid();
    this._source = {};
    this._layers = [];
  }

  async addTo(map) {
    this._map = map;

    const images = this.getImages();
    const source = this.getSource();
    const layers = this.getLayers();

    if (images) {
      await addImages(map, images);
    }

    Object.keys(source).forEach(id => map.addSource(id, source[id]));
    layers.forEach(layer => map.addLayer(layer));
  }

  removeFrom(map) {
    const source = this.getSource();
    const layers = this.getLayers();

    layers.forEach(layer => map.removeLayer(layer.id));
    Object.keys(source).forEach(id => map.removeSource(id));

    this._map = null;
  }

  setVisibility(isVisible) {
    const map = this.getMap();
    const value = isVisible ? "visible" : "none";
    const layers = this.getLayers();

    if (map && layers) {
      layers.forEach(layer =>
        this.getMap().setLayoutProperty(layer.id, "visibility", value)
      );
    }
  }

  getId() {
    return this._id;
  }

  getMap() {
    return this._map;
  }

  isOnMap() {
    return !!this._map;
  }

  setSource(id, source) {
    this._source[id] = source;
  }

  getSource() {
    return this._source;
  }

  setLayer(layer) {
    this._layers.push(layer);
  }

  getLayers() {
    return this._layers;
  }

  hasLayerId(id) {
    return this.getLayers().find(layer => layer.id === id);
  }

  getFeatures() {
    return this._features;
  }

  setFeatures(data) {
    this._features = {
      type: "FeatureCollection",
      features: data
    };
  }

  getImages() {
    return this._images;
  }

  setImages(images) {
    this._images = images;
  }

  setOpacity() {}

  getBounds() {
    const data = this.getFeatures();

    if (data && data.features.length) {
      const b = bbox(data);
      const bounds = [[b[1], b[0]], [b[3], b[2]]];
      bounds.isValid = () => true;
      return bounds;
    }

    return { isValid: () => false };
  }
}

export default Layer;
