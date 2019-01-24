import Layer from "./Layer";

class Markers extends Layer {
  constructor(config) {
    super();
    const { data } = config;

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
    }
  }
}

export default Markers;
