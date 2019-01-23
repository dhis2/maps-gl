import uuid from "uuid/v4";

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
    }
  };
};

export const createLayer = config => {
  switch (config.type) {
    case "tileLayer":
      return createTileLayer(config);
    default:
      console.log("Unknown layer type", config.type);
  }
};

export default createLayer;
