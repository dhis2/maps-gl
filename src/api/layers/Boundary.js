import Layer from "./Layer";

class Boundary extends Layer {
  constructor(config) {
    super();

    const { data } = config;
    this.setFeatures(data);
    this.createSource();
    this.createLayers();
  }

  // TODO: Find better way keep style
  setFeatures(data) {
    this._features = {
      type: "FeatureCollection",
      features: data.map(f => {
        f.properties.color = f.properties.style.color;
        f.properties.weight = f.properties.style.weight;
        return f;
      })
    };
  }

  createSource() {
    const id = this.getId();
    const features = this.getFeatures();

    this.setSource(id, {
      type: "geojson",
      data: features
    });
  }

  createLayers() {
    const id = this.getId();

    this.setLayer({
      id,
      type: "line",
      source: id,
      paint: {
        "line-color": ["get", "color"],
        "line-width": ["get", "weight"]
      }
    });
  }

  setOpacity(opacity) {
    if (this.isOnMap()) {
      const mapgl = this.getMapGL();
      const id = this.getId();

      mapgl.setPaintProperty(id, "line-opacity", opacity);
    }
  }
}

export default Boundary;
