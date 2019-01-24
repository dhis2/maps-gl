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

    this.map.on("click", evt => this.onClick(evt));
    this.map.on("contextmenu", evt => this.onContextMenu(evt));

    this._isReady = false;
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

  async addLayerWhenReady(layer) {
    if (!layer.isOnMap()) {
      layer.addTo(this.map);
    }
    this._isReady = true;
  }

  addLayer(layer) {
    if (!layer.isOnMap()) {
      if (this.isMapReady()) {
        this.addLayerWhenReady(layer);
      } else {
        this.map.once("styledata", () => this.addLayerWhenReady(layer));
      }
    }
  }

  removeLayer(layer) {
    layer.removeFrom(this.map);
  }

  isMapReady() {
    return this._isReady || this.map.isStyleLoaded();
  }

  hasLayer(layer) {
    return layer.isOnMap();
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
