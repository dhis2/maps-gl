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
    this._index = null;
    this.off = this.removeListener; // TODO: Why needed?
  }

  async addTo(map) {
    this._map = map;

    const mapgl = map.getMapGL();
    const images = this.getImages();
    const source = this.getSource();
    const layers = this.getLayers();

    if (images) {
      await addImages(mapgl, images);
    }

    Object.keys(source).forEach(id => mapgl.addSource(id, source[id]));
    layers.forEach(layer => mapgl.addLayer(layer));
  }

  removeFrom(map) {
    const mapgl = map.getMapGL();
    const source = this.getSource();
    const layers = this.getLayers();

    layers.forEach(layer => mapgl.removeLayer(layer.id));
    Object.keys(source).forEach(id => mapgl.removeSource(id));

    this._map = null;
  }

  setVisibility(isVisible) {
    const mapgl = this.getMapGL();
    const value = isVisible ? "visible" : "none";
    const layers = this.getLayers();

    if (mapgl && layers) {
      layers.forEach(layer =>
        mapgl.setLayoutProperty(layer.id, "visibility", value)
      );
    }
  }

  getId() {
    return this._id;
  }

  getMap() {
    return this._map;
  }

  getMapGL() {
    return this._map && this._map.getMapGL();
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

  moveToTop() {
    const mapgl = this.getMapGL();
    this.getLayers().forEach(layer => mapgl.moveLayer(layer.id));
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

  setIndex(index) {
    this._index = index;
    this.getMap().orderLayers();
  }

  getIndex() {
    return this._index;
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
