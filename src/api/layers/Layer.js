import uuid from "uuid/v4";
import EventEmitter from "events";

class Layer extends EventEmitter {
  constructor() {
    super();
    this._id = uuid();
    this._source = {};
    this._layers = [];
  }

  addTo(map) {
    const source = this.getSource();
    const layers = this.getLayers();

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

  setOpacity() {}

  getBounds() {
    return {
      // TODO
      isValid() {
        return false;
      }
    };
  }
}

export default Layer;
