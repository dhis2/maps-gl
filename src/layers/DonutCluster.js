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
        const features = mapgl.querySourceFeatures(this.getId())

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

        mapgl.on('data', this.onData)
        mapgl.on('move', this.updateClusters)
        mapgl.on('moveend', this.updateClusters)

        this.updateClusters()
    }

    onRemove() {
        super.onRemove()

        const mapgl = this.getMapGL()

        mapgl.off('data', this.onData)
        mapgl.off('move', this.updateClusters)
        mapgl.off('moveend', this.updateClusters)

        for (const id in this.clustersOnScreen) {
            this.clustersOnScreen[id].remove()
        }

        this.clustersOnScreen = {}
        this.clusters = {}
    }

    onData = evt => {
        if (evt.sourceId === this.getId() && evt.isSourceLoaded) {
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
            if (this.spiderId) {
                this.setSpiderClusterOpacity(this.spiderId, true)
            }
        }
    }

    setSpiderClusterOpacity(clusterId, isExpanded) {
        const cluster = this.clusters[clusterId]
        const { opacity } = this.options

        if (cluster) {
            cluster.setOpacity(
                isExpanded ? (opacity < 0.1 ? opacity : 0.1) : opacity
            )
        }
    }
}

export default DonutCluster
