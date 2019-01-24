import Layer from "./Layer";
import { getPolygonLabels } from "../utils/labels";

class Choropleth extends Layer {
  constructor(config) {
    super();

    const { data } = config;
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

    this.setLayer({
      id,
      type: "fill",
      source: id,
      paint: {
        "fill-color": ["get", "color"],
        "fill-outline-color": "#333"
      }
    });

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

  setOpacity(opacity) {
    if (this.isOnMap()) {
      const map = this.getMap();
      const id = this.getId();

      map.setPaintProperty(id, "fill-opacity", opacity);
      map.setPaintProperty(`${id}-labels`, "text-opacity", opacity);
    }
  }
}

export default Choropleth;
