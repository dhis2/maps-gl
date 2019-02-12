import uuid from "uuid/v4";
import EventEmitter from "events";
import bbox from "@turf/bbox";
import { addImages } from "../utils/images";

class Layer extends EventEmitter {
  constructor(options = {}) {
    super();
    this._id = uuid();
    this._source = {};
    this._layers = [];
    this._index = null;
    this.options = options;
    this.off = this.removeListener; // TODO: Why needed?
  }

  async addTo(map) {
    const { onClick, onRightClick } = this.options;

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

    if (onClick) {
      this.on('click', onClick);
    }

    if (onRightClick) {
      this.on('contextmenu', onRightClick);
    }
  }

  removeFrom(map) {
    const mapgl = map.getMapGL();
    const source = this.getSource();
    const layers = this.getLayers();
    const { onClick, onRightClick } = this.options;

    layers.forEach(layer => mapgl.removeLayer(layer.id));
    Object.keys(source).forEach(id => mapgl.removeSource(id));

    if (onClick) {
      this.off('click', onClick);
    }

    if (onRightClick) {
      this.off('contextmenu', onRightClick);
    }

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
    // this.getMap().orderLayers();
  }

  getIndex() {
    return this._index;
  }

  setOpacity() {}

  getBounds() {
    const data = this.getFeatures();

    if (data && data.features.length) {
      return bbox(data);
    }
  }

  // "Normalise" event before passing back to app
  onClick(evt) {
    console.log('onClick', evt);
  }

  // "Normalise" event before passing back to app
  onRightClick(evt) {
    console.log('onRightClick', evt);
  }

}

export default Layer;
