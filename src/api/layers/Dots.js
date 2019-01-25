import Layer from "./Layer";

class Dots extends Layer {
  constructor(config) {
    super();

    const { data, radius } = config;
    this.setFeatures(data);
    this.createSource();
    this.createLayers(radius);
  }

  createSource() {
    const id = this.getId();
    const features = this.getFeatures();

    this.setSource(id, {
      type: "geojson",
      data: features
    });
  }

  createLayers(radius) {
    const id = this.getId();

    this.setLayer({
      id,
      type: "circle",
      source: id,
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": radius,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff"
      }
    });
  }

  setOpacity(opacity) {
    if (this.isOnMap()) {
      const mapgl = this.getMapGL();
      const id = this.getId();

      mapgl.setPaintProperty(id, "circle-opacity", opacity);
      mapgl.setPaintProperty(id, "circle-stroke-opacity", opacity);
    }
  }
}

export default Dots;
