import Layer from "./Layer";
import { getLablesSource, getLabelsLayer } from "../utils/labels";

class Choropleth extends Layer {
  constructor(options) {
    super(options);

    const { data } = options;
    this.setFeatures(data);
    this.createSource();
    this.createLayers();
  }

  createSource() {
    const id = this.getId();
    const features = this.getFeatures();
    const { label } = this.options;

    this.setSource(id, {
      type: "geojson",
      data: features
    });

    if (label) {
      this.setSource(`${id}-labels`, getLablesSource(features));
    }
  }

  createLayers() {
    const id = this.getId();
    const { label, labelStyle } = this.options;

    this.setLayer({
      id,
      type: "fill",
      source: id,
      paint: {
        "fill-color": ["get", "color"],
        "fill-outline-color": "#333",
      }
    });

    this.setLayer({
      id: `${id}-hover`,
      type: "line",
      source: id,
      paint: {
        "line-color": "#333",
        "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 3, 1],
      }
    });

    if (label) {
      this.setLayer(getLabelsLayer(id, label, labelStyle));
    }

    this.setIteractiveLayerId(id);
  }

  setOpacity(opacity) {
    if (this.isOnMap()) {
      const mapgl = this.getMapGL();
      const id = this.getId();
      const { label } = this.options;

      mapgl.setPaintProperty(id, "fill-opacity", opacity);

      if (label) {
        mapgl.setPaintProperty(`${id}-labels`, "text-opacity", opacity);
      }
    }
  }
}

export default Choropleth;
