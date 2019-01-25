import Layer from "./Layer";

class TileLayer extends Layer {
  constructor(config) {
    super();
    const { url, attribution } = config;
    this.createSource(url, attribution);
    this.createLayer();
  }

  createSource(url, attribution) {
    let tiles;

    if (url.includes("{s}")) {
      tiles = ["a", "b", "c"].map(letter => url.replace("{s}", letter));
    } else {
      tiles = [url];
    }

    this.setSource(this.getId(), {
      type: "raster",
      tiles,
      tileSize: 256,
      attribution
    });
  }

  createLayer() {
    this.setLayer({
      id: this.getId(),
      type: "raster",
      source: this.getId()
    });
  }

  setOpacity(opacity) {
    if (this.isOnMap()) {
      const mapgl = this.getMapGL();
      mapgl.setPaintProperty(this.getId(), "raster-opacity", opacity);
    }
  }
}

export default TileLayer;
