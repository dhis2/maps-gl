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
    const images = this.getImages();
    const source = this.getSource();
    const layers = this.getLayers();

    if (images) {
      console.log(images);
      await addImages(map, images);
    }

    Object.keys(source).forEach(id => map.addSource(id, source[id]));
    layers.forEach(layer => map.addLayer(layer));

    this._map = map;
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
