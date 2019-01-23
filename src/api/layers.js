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

export const createMarkersLayer = config => {
  const { data, hoverLabel } = config;
  const id = uuid();
  const images = {};
  const features = {
    type: "FeatureCollection",
    features: data
  };

  data.forEach(
    f => (images[f.properties.icon.iconUrl] = f.properties.icon.iconSize)
  );

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
        "circle-color": "black",
        "circle-radius": 10,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff"
      }
    },
    images: Object.keys(images).map(image => ({
      url: image,
      size: images[image]
    })),
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
    },
    on() {},
    off() {}
  };
};

export const createBoundaryLayer = config => {
  const { hoverLabel, data } = config;
  const id = uuid();

  // TODO: Find better way keep style
  const features = {
    type: "FeatureCollection",
    features: data.map(f => {
      f.properties.color = f.properties.style.color;
      f.properties.weight = f.properties.style.weight;
      return f;
    })
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
      type: "line",
      source: id,
      paint: {
        "line-color": ["get", "color"],
        "line-width": ["get", "weight"]
      }
    },
    setOpacity(opacity) {
      if (this.map) {
        this.map.setPaintProperty(this.id, "line-opacity", opacity);
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

export const createClientClusterLayer = config => {
  const { color, radius, data } = config;
  const id = uuid();
  const features = {
    type: "FeatureCollection",
    features: data
  };

  return {
    id,
    source: {
      type: "geojson",
      data: features,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    },
    layers: [
      {
        id: `${id}-clusters`,
        type: "circle",
        source: id,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": color,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            15,
            10,
            20,
            1000,
            25,
            10000,
            30
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff"
        }
      },
      {
        id: `${id}-count`,
        type: "symbol",
        source: id,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold"],
          "text-size": 16
        },
        paint: {
          "text-color": "#fff"
        }
      },
      {
        id: id,
        type: "circle",
        source: id,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": radius,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff"
        }
      }
    ],
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
    case "clientCluster":
      return createClientClusterLayer(config);
    case "boundary":
      return createBoundaryLayer(config);
    case "markers":
      return createMarkersLayer(config);
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
