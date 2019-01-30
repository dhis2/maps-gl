import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import EventEmitter from "events";
import getControl from "./controls";
import Layer from "./layers/Layer";
import TileLayer from "./layers/TileLayer";
import Choropleth from "./layers/Choropleth";
import Boundary from "./layers/Boundary";
import Markers from "./layers/Markers";
import Dots from "./layers/Dots";
import ClientCluster from "./layers/ClientCluster";

export class Map extends EventEmitter {
  constructor(el) {
    super();
    this._mapgl = new mapboxgl.Map({
      container: el,
      style: {
        version: 8,
        sources: {},
        layers: [],
        glyphs: "http://fonts.openmaptiles.org/{fontstack}/{range}.pbf" // TODO: Host ourseleves
      },
      maxZoom: 18
    });

    this._mapgl.on("click", evt => this.onClick(evt));
    this._mapgl.on("contextmenu", evt => this.onContextMenu(evt));

    this._layers = [];
    this._isReady = false;
  }

  fitBounds(bounds) {
    // console.log("fitBounds", bounds);
    const [a, b] = bounds;

    // TODO: Avoid timeout
    setTimeout(() => {
      this._mapgl.fitBounds([[a[1], a[0]], [b[1], b[0]]]);
    }, 200);
  }

  getContainer() {
    return this._mapgl.getContainer();
  }

  getMapGL() {
    return this._mapgl;
  }

  async addLayerWhenReady(layer) {
    if (!layer.isOnMap()) {
      layer.addTo(this);
    }
    layer.setIndex(this._layers.length);
    this._layers.push(layer);
    this._isReady = true;
  }

  addLayer(layer) {
    if (!layer.isOnMap()) {
      if (this.isMapReady()) {
        this.addLayerWhenReady(layer);
      } else {
        this._mapgl.once("styledata", () => this.addLayerWhenReady(layer));
      }
    }
  }

  removeLayer(layer) {
    layer.removeFrom(this);
    this._layers = this._layers.filter(l => l !== layer);
  }

  remove() {
    console.log("remove map");
  }

  isMapReady() {
    return this._isReady || this._mapgl.isStyleLoaded();
  }

  hasLayer(layer) {
    return layer && layer.isOnMap();
  }

  addControl(control) {
    const mapboxControl = getControl(control);

    if (mapboxControl) {
      this._mapgl.addControl(mapboxControl);
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
      case "boundary":
        return new Boundary(config);
      case "markers":
        return new Markers(config);
      case "dots":
        return new Dots(config);
      case "clientCluster":
        return new ClientCluster(config);
      default:
        console.log("Unknown layer type", config.type);
        return new Layer();
    }
  }

  createPane() {}

  openPopup(popup) {
    console.log("openPopup", popup);
  }

  resize() {
    this._mapgl.resize();
  }

  onClick(evt) {
    const feature = this.getEventFeature(evt);
    if (feature) {
      const layer = this.getLayerFromId(feature.layer.id);
      layer.emit("click", {
        layer: { feature },
        lngLat: evt.lngLat
      });
    } else {
      console.log("no feature", evt);
    }
  }

  onContextMenu(evt) {
    const feature = this.getEventFeature(evt);
    if (feature) {
      const layer = this.getLayerFromId(feature.layer.id);
      layer.emit("contextmenu", {
        layer: { feature },
        latlng: evt.lngLat,
        originalEvent: evt.originalEvent
      });
    } else {
      console.log("no feature", evt);
    }
  }

  getEventFeature(evt) {
    return this._mapgl.queryRenderedFeatures(evt.point, {
      // layers: this.props.layers // Contains visible layers
    })[0]; // [0] returns topmost
  }

  getLayerFromId(id) {
    return this._layers.find(layer => layer.hasLayerId(id));
  }

  getLayerAtIndex(index) {
    return this._layers[index];
  }

  getLayers() {
    return this._layers;
  }

  orderLayers() {
    const outOfOrder = this._layers.some(
      (layer, index) => layer.getIndex() !== index
    );

    if (outOfOrder) {
      const layers = this._layers;
      layers.sort((a, b) => a.getIndex() - b.getIndex());

      for (let i = 1; i < layers.length; i++) {
        layers[i].moveToTop();
      }
    }
  }

  setPopup(lngLat, content) {
    new mapboxgl.Popup()
      .setLngLat(lngLat)
      .setHTML(content)
      .addTo(this._mapgl);
  }
}

export default Map;
