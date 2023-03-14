import throttle from 'lodash.throttle'
import Cluster from './Cluster'
import DonutMarker from './DonutMarker'
import { featureCollection } from '../utils/geometry'

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
            data: featureCollection(this.getFeatures()),
        })
    }

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

        if (mapgl) {
            mapgl.off('sourcedata', this.onSourceData)
            mapgl.off('move', this.updateClusters)
            mapgl.off('moveend', this.updateClusters)
        }

        for (const id in this.clustersOnScreen) {
            this.clustersOnScreen[id].remove()
        }

        this.clustersOnScreen = {}
        this.clusters = {}
    }

    onSourceData = evt => {
        if (evt.sourceId === this.getId() && this.getSourceFeatures().length) {
            this.updateClusters()
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

    setVisibility(isVisible) {
        super.setVisibility(isVisible)

        if (this.isOnMap()) {
            for (const id in this.clusters) {
                this.clusters[id].setVisibility(isVisible)
            }
        }

        this._isVisible = isVisible
    }

    // Sort cluster features after legend colors before spiderfy
    sortClusterFeatures = features => {
        const colors = this.options.groups.map(g => g.color)
        return features.sort((f1, f2) => {
            const a = colors.indexOf(f1.properties.color)
            const b = colors.indexOf(f2.properties.color)

            return (a > b) - (a < b)
        })
    }

    // TODO: Is throttle needed?
    updateClusters = throttle(() => {
        const { groups, opacity } = this.options
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

        if (this._hasPolygons) {
            this.updatePolygons()
        }
    }, 100)
}

export default DonutCluster
