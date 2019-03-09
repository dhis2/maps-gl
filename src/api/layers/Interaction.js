import EventEmitter from "events";

const hoverSource = "feature-hover";

class Interaction extends EventEmitter {
    addTo(map) {
        this._map = map;
        const mapgl = this.getMapGL();

        if (mapgl.isStyleLoaded()) {
            this.addInteraction();
          } else {
            mapgl.once('styledata', this.addInteraction.bind(this)); // TODO: Remove bind
          }
    }

    remove() {
        this.removeInteraction();
        this._map = null;
    }

    getMapGL() {
        return this._map.getMapGL();
    }

    addInteraction() {
        const mapgl = this.getMapGL();

        this.addHoverSource();
        this.addHoverLayer();

        mapgl.on('mousemove', this.onMouseMove.bind(this)); // TODO: Remove bind
        console.log('addInteraction');
    }

    removeInteraction() {
        this.removeHoverSource();
        this.removeHoverLayer();
    }

    // Add source for hover feature
    addHoverSource() {
        this.getMapGL().addSource(hoverSource, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });  
    }

    getHoverSource() {
        return this.getMapGL().getSource(hoverSource);
    }

    // Remove source for hover state
    removeHoverSource() {
        if (this.getHoverSource()) {
            this.getMapGL().removeSource(hoverSource);
        }
    }

    addHoverLayer() {
        console.log('addHoverLayer');

        this.getMapGL().addLayer({
            id: 'test',
            type: "fill",
            source: hoverSource,
            paint: {
              "fill-color": "#333",
              "fill-outline-color": "#333",
            }
          });

    }

    getHoverLayer() {}

    removeHoverLayer() {}

    // Get topmost feature below event position
    // TODO: Use function on map
    getEventFeature(point) {
        const layers = this.getFeatureLayers();

        if (layers.length) {
            return this.getMapGL().queryRenderedFeatures(point, { layers: layers })[0];
        }
    }

    getFeatureLayers() {
        return this._map
            .getLayers()
            .filter(l => l.isVisible() && l.getType() !== 'tileLayer')
            .map(l => l.getId());
    }

    onMouseMove(evt) {
        const feature = this.getEventFeature(evt.point);
        let featureId;

        if (feature) {
            featureId = feature.properties.id;
        }

        if (featureId !== this._hoverFeatureId) {
            this.highlightFeature(feature);
            this.getMapGL().getCanvas().style.cursor = featureId ? 'pointer' : '';

            this._hoverFeatureId = featureId;
        }
    }

    highlightFeature(feature) {
        this.getHoverSource().setData({
            type: "FeatureCollection",
            features: feature ? [feature] : [],
          });

        if (feature) {
            this.getMapGL().moveLayer('test')

            console.log('highlightFeature', feature);
        } else {
            console.log('unhighlightFeature');
        }

    }
}

export default Interaction;