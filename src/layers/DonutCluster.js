import throttle from 'lodash.throttle'
import Cluster from './Cluster'
import DonutMarker from './DonutMarker'

class DonutCluster extends Cluster {
    clusters = {}
    clustersOnScreen = {}

    createSource() {
        super.createSource({
            cluster: true,
            clusterProperties: this.options.groups.reduce((obj, { color }) => {
                obj[color] = [
                    '+',
                    ['case', ['==', ['get', 'color'], color], 1, 0],
                ]
                return obj
            }, {}),
            data: this.getFeatures(),
        })
    }

    updateClusters = throttle(() => {
        const { groups, opacity } = this.options
        const mapgl = this.getMapGL()
        const newClusters = {}
        const features = this.getSourceFeatures()

        // For every cluster on the screen, create an donut marker
        for (let i = 0; i < features.length; i++) {
            const { geometry, properties } = features[i]
            const { coordinates } = geometry
            const { cluster: isCluster, cluster_id } = properties

            if (!isCluster) {
                continue
            }

            let cluster = this.clusters[cluster_id]

            if (!cluster) {
                const segments = groups.map(group => ({
                    ...group,
                    count: properties[group.color],
                }))

                cluster = new DonutMarker(segments, {
                    opacity,
                })

                cluster.setLngLat(coordinates)
                cluster.on('click', () => {
                    this.zoomToCluster(cluster_id, coordinates)
                })

                this.clusters[cluster_id] = cluster
            }

            newClusters[cluster_id] = cluster

            // Add it to the map if it's not there already
            if (!this.clustersOnScreen[cluster_id]) {
                cluster.addTo(this.getMapGL())
            }
        }

        // For every cluster we've added previously, remove those that are no longer visible
        for (const id in this.clustersOnScreen) {
            if (!newClusters[id]) {
                this.clustersOnScreen[id].remove()
            }
        }
        this.clustersOnScreen = newClusters
    }, 100)

    onAdd() {
        super.onAdd()

        const mapgl = this.getMapGL()

        mapgl.on('sourcedata', this.onSourceData)
        mapgl.on('move', this.updateClusters)
        mapgl.on('moveend', this.updateClusters)

        this.updateClusters()
    }

    onRemove() {
        super.onRemove()

        const mapgl = this.getMapGL()

        mapgl.off('sourcedata', this.onSourceData)
        mapgl.off('move', this.updateClusters)
        mapgl.off('moveend', this.updateClusters)

        for (const id in this.clustersOnScreen) {
            this.clustersOnScreen[id].remove()
        }

        this.clustersOnScreen = {}
        this.clusters = {}
    }

    onSourceData = evt => {
        if (evt.sourceId === this.getId() && this.getSourceFeatures().length) {
            this.getMapGL().off('sourcedata', this.onSourceData)
            this.updateClusters()
        }
    }

    onClick = evt => {
        const { feature } = evt

        if (!feature.properties.cluster) {
            // Hack until Mapbox GL JS support string ids
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

    setOpacity(opacity) {
        super.setOpacity(opacity)

        if (this.isOnMap()) {
            for (const id in this.clusters) {
                this.clusters[id].setOpacity(opacity)
            }
        }
    }

    setClusterOpacity(clusterId, isExpanded) {
        if (clusterId) {
            const cluster = this.clusters[clusterId]
            const { opacity } = this.options

            if (cluster) {
                cluster.setOpacity(
                    isExpanded ? (opacity < 0.1 ? opacity : 0.1) : opacity
                )
            }
        }
    }

    // Returns source features
    getSourceFeatures() {
        return this.getMapGL().querySourceFeatures(this.getId())
    }
}

export default DonutCluster
