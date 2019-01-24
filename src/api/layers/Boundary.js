import Layer from "./Layer";

class Boundary extends Layer {
  constructor(config) {
    super();
  }

  createSource() {}

  createLayers() {}

  setOpacity(opacity) {
    if (this.isOnMap()) {
    }
  }
}

export default Boundary;
