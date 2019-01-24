import Layer from "./Layer";

class ClientCluster extends Layer {
  constructor(config) {
    super();

    const { data, color, radius } = config;
    this.setFeatures(data);
    this.createSource();
    this.createLayers(color, radius);
  }

  createSource() {
    const id = this.getId();
    const features = this.getFeatures();

    this.setSource(id, {
      type: "geojson",
      data: features,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });
  }

  createLayers(color, radius) {
    const id = this.getId();

    this.setLayer({
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
    });

    this.setLayer({
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
    });

    this.setLayer({
      id,
      type: "circle",
      source: id,
      filter: ["!", ["has", "point_count"]],
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
      const map = this.getMap();
      const id = this.getId();

      map.setPaintProperty(id, "circle-opacity", opacity);
      map.setPaintProperty(id, "circle-stroke-opacity", opacity);
      map.setPaintProperty(`${id}-clusters`, "circle-opacity", opacity);
      map.setPaintProperty(`${id}-clusters`, "circle-stroke-opacity", opacity);
      map.setPaintProperty(`${id}-count`, "text-opacity", opacity);
    }
  }
}

export default ClientCluster;
