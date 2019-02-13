import Layer from "./Layer";

class Markers extends Layer {
  constructor(options) {
    super(options);
    const { data } = options;

    this.setFeatures(data);
    this.setImages();
    this.createSource();
    this.createLayer();
  }

  setImages() {
    const data = this.getFeatures();
    const images = {};

    data.features.forEach(f => {
      images[f.properties.icon.iconUrl] = f.properties.icon.iconSize;
      f.properties.iconUrl = f.properties.icon.iconUrl;
    });

    this._images = Object.keys(images);
  }

  createSource() {
    const id = this.getId();
    const features = this.getFeatures();

    this.setSource(id, {
      type: "geojson",
      data: features
    });
  }

  createLayer() {
    const id = this.getId();

    this.setLayer({
      id,
      type: "symbol",
      source: id,
      layout: {
        "icon-image": "http://localhost:8080/images/orgunitgroup/05.png",
        "icon-size": 0.05,
        "icon-allow-overlap": true
      }
    });
  }

  setOpacity(opacity) {
    if (this.isOnMap()) {
      const mapgl = this.getMapGL();
      const id = this.getId();

      mapgl.setPaintProperty(id, "icon-opacity", opacity);
    }
  }
}

export default Markers;
