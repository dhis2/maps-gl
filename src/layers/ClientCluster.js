import Cluster from './Cluster'
import { featureCollection } from '../utils/geometry'
import { clusterLayer, clusterCountLayer } from '../utils/layers'
import { eventStrokeColor, clusterCountColor } from '../utils/style'

class ClientCluster extends Cluster {
    createSource() {
        super.createSource({
            cluster: true,
            data: featureCollection(this.getFeatures()),
        })
    }

    createLayers() {
        const id = this.getId()
        const {
            fillColor: color,
            strokeColor = eventStrokeColor,
            countColor = clusterCountColor,
        } = this.options
        const isInteractive = true

        super.createLayers()

        // Clusters
        this.addLayer(clusterLayer({ id, color, strokeColor }), {
            isInteractive,
        })
        this.addLayer(clusterCountLayer({ id, color: countColor }))
    }

    onAdd() {
        super.onAdd()

        if (this._hasPolygons) {
            const mapgl = this.getMapGL()

            mapgl.on('sourcedata', this.onSourceData)
            mapgl.on('moveend', this.updatePolygons)

            this.updatePolygons()
        }
    }

    onRemove() {
        super.onRemove()

        if (this._hasPolygons) {
            const mapgl = this.getMapGL()

            mapgl.off('sourcedata', this.onSourceData)
            mapgl.off('moveend', this.updatePolygons)
        }
    }

    onClick = evt => {
        const { feature } = evt

        if (!feature.properties.cluster) {
            // Hack until MapLibre GL JS support string ids
            // https://github.com/mapbox/mapbox-gl-js/issues/2716
            if (
                typeof feature.id === 'number' &&
                typeof feature.properties.id === 'string'
            ) {
                const { type, properties, geometry } = feature
                const { id } = properties
                evt.feature = { type, id, properties, geometry }
            }

            this.fire('click', evt)
        } else {
            this.zoomToCluster(
                feature.properties.cluster_id,
                feature.geometry.coordinates
            )
        }
    }

    onSourceData = evt => {
        if (evt.sourceId === this.getId() && this.getSourceFeatures().length) {
            this.getMapGL().off('sourcedata', this.onSourceData)
            this.updatePolygons()
        }
    }

    // Returns all features in a cluster
    getClusterFeatures = clusterId =>
        new Promise((resolve, reject) => {
            const mapgl = this.getMapGL()
            const source = mapgl.getSource(this.getId())

            source.getClusterLeaves(clusterId, null, null, (error, features) =>
                error ? reject(error) : resolve(features)
            )
        })
}

export default ClientCluster
