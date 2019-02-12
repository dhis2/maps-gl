import Layer from "./Layer";
import { getPolygonLabels } from "../utils/labels";

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

    const labels = getPolygonLabels(features);

    this.setSource(id, {
      type: "geojson",
      data: features
    });

    this.setSource(`${id}-labels`, {
      type: "geojson",
      data: labels
    });
  }

  createLayers() {
    const id = this.getId();
    const { label } = this.options;

    this.setLayer({
      id,
      type: "fill",
      source: id,
      paint: {
        "fill-color": ["get", "color"],
        "fill-outline-color": "#333"
      }
    });

    console.log('##', this.options);

    if (label) {
      this.setLayer({
        id: `${id}-labels`,
        type: "symbol",
        source: `${id}-labels`,
        layout: {
          "text-field": "{name}",
          "text-font": ["Open Sans Regular"],
          "text-size": 14
        },
        paint: {
          "text-color": "#333"
        }
      });
    }
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
