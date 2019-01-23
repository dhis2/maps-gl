import uuid from "uuid/v4";
import bbox from "@turf/bbox";

export const createTileLayer = config => {
  const { url, attribution } = config;
  const id = uuid();
  let tiles = [url];

  if (url.includes("{s}")) {
    tiles = ["a", "b", "c"].map(letter => url.replace("{s}", letter));
  }

  return {
    id,
    source: {
      type: "raster",
      tiles,
      tileSize: 256,
      attribution
    },
    layer: {
      id: id,
      type: "raster",
      source: id
    },
    setOpacity(opacity) {
      if (this.map) {
        this.map.setPaintProperty(this.id, "raster-opacity", opacity);
      }
    },
    on() {},
    off() {},
    getBounds() {}
  };
};

export const createChoroplethLayer = config => {
  const { hoverLabel, data } = config;
  const id = uuid();
  const features = {
    type: "FeatureCollection",
    features: data
  };

  return {
    id,
    hoverLabel,
    source: {
      type: "geojson",
      data: features
    },
    layer: {
      id: id,
      type: "fill",
      source: id,
      paint: {
        "fill-color": ["get", "color"],
        "fill-outline-color": "#333"
      }
    },
    setOpacity(opacity) {
      if (this.map) {
        this.map.setPaintProperty(this.id, "fill-opacity", opacity);
      }
    },
    on() {},
    off() {},
    getBounds() {
      const b = bbox(features);
      const bounds = [[b[1], b[0]], [b[3], b[2]]];
      bounds.isValid = () => true;
      return bounds;
    }
  };
};

export const createDotsLayer = config => {
  const { radius, data } = config;
  const id = uuid();
  const features = {
    type: "FeatureCollection",
    features: data
  };

  return {
    id,
    source: {
      type: "geojson",
      data: features
    },
    layer: {
      id: id,
      type: "circle",
      source: id,
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": radius,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff"
      }
    },
    setOpacity(opacity) {
      if (this.map) {
        this.map.setPaintProperty(this.id, "circle-opacity", opacity);
      }
    },
    getBounds() {
      const b = bbox(features);
      const bounds = [[b[1], b[0]], [b[3], b[2]]];
      bounds.isValid = () => true;
      return bounds;
    }
  };
};

export const createLayer = config => {
  switch (config.type) {
    case "tileLayer":
      return createTileLayer(config);
    case "choropleth":
      return createChoroplethLayer(config);
    case "dots":
      return createDotsLayer(config);
    default:
      console.log("Unknown layer type", config.type);
      return {
        setOpacity() {},
        on() {},
        off() {},
        getBounds() {}
      };
  }
};

export default createLayer;
