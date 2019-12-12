import throttle from 'lodash.throttle'
import Layer from './Layer'
import DonutMarker from './DonutMarker'
import { isPoint, isPolygon, isCluster, noCluster } from '../utils/filters'
import {
    outlineColor,
    outlineWidth,
    clusterRadius,
    textFont,
    textSize,
    textColor,
} from '../utils/style'

// Based on: https://docs.mapbox.com/mapbox-gl-js/example/cluster-html/

// Get contents of clusters:
// https://docs.mapbox.com/mapbox-gl-js/api/#geojsonsource#getclusterexpansionzoom
// https://github.com/mapbox/mapbox-gl-js/issues/3318
// https://github.com/mapbox/mapbox-gl-js/pull/6829
// https://github.com/bewithjonam/mapboxgl-spiderifier
class ClientCluster extends Layer {
    constructor(options) {
        super(options)

        const { data, fillColor, radius } = options

        // Caching clusters for performance
        this.clusters = {}
        this.clustersOnScreen = {}

        this.setFeatures(data)
        this.createSource()
        this.createLayers(fillColor, radius)

        this.updateClustersThrottled = throttle(this.updateClusters, 100)
    }

    createSource() {
        const id = this.getId()
        const data = this.getFeatures()
        let clusterProperties

        if (this.isDonutClusters()) {
            clusterProperties = this.options.groups.reduce((obj, { color }) => {
                obj[color] = [
                    '+',
                    ['case', ['==', ['get', 'color'], color], 1, 0],
                ]
                return obj
            }, {})
        }

        this.setSource(id, {
            type: 'geojson',
            data,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
            clusterProperties,
        })
    }

    createLayers(color, radius) {
        const id = this.getId()
        const colorExpr = ['case', ['has', 'color'], ['get', 'color'], color]

        // Non-clustered points
        this.addLayer(
            {
                id: `${id}-points`,
                type: 'circle',
                source: id,
                filter: ['all', noCluster, isPoint],
                paint: {
                    'circle-color': colorExpr,
                    'circle-radius': radius,
                    'circle-stroke-width': outlineWidth,
                    'circle-stroke-color': outlineColor,
                },
            },
            true
        )

        // Non-clustered polygons
        this.addLayer(
            {
                id: `${id}-polygons`,
                type: 'fill',
                source: id,
                filter: ['all', noCluster, isPolygon],
                paint: {
                    'fill-color': colorExpr,
                    'fill-outline-color': outlineColor,
                },
            },
            true
        )

        if (!this.isDonutClusters()) {
            this.addLayer(
                {
                    id: `${id}-clusters`,
                    type: 'circle',
                    source: id,
                    filter: isCluster,
                    paint: {
                        'circle-color': color,
                        'circle-radius': clusterRadius,
                        'circle-stroke-width': outlineWidth,
                        'circle-stroke-color': outlineColor,
                    },
                },
                true
            )

            this.addLayer({
                id: `${id}-count`,
                type: 'symbol',
                source: id,
                filter: isCluster,
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': textFont,
                    'text-size': textSize,
                },
                paint: {
                    'text-color': textColor,
                },
            })
        }
    }

    updateClusters = () => {
        const { groups } = this.options
        const mapgl = this.getMapGL()
        const newClusters = {}
        const features = mapgl.querySourceFeatures(this.getId())

        // For every cluster on the screen, create an HTML marker for it
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

                cluster = new DonutMarker(segments)

                cluster.setLngLat(coordinates)
                cluster.on('click', () =>
                    this.zoomToCluster(cluster_id, coordinates)
                )

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
    }

    isDonutClusters() {
        return Array.isArray(this.options.groups)
    }

    onAdd() {
        if (this.isDonutClusters()) {
            const mapgl = this.getMapGL()

            mapgl.on('data', this.onData)
            mapgl.on('move', this.updateClustersThrottled)
            mapgl.on('moveend', this.updateClustersThrottled)

            this.updateClustersThrottled()
        }
    }

    onRemove() {
        if (this.isDonutClusters()) {
            const mapgl = this.getMapGL()
            mapgl.off('data', this.onData)
            mapgl.off('move', this.updateClustersThrottled)
            mapgl.off('moveend', this.updateClustersThrottled)

            for (const id in this.clustersOnScreen) {
                this.clustersOnScreen[id].remove()
            }

            this.clustersOnScreen = {}
            this.clusters = {}
        }
    }

    onData = evt => {
        if (evt.sourceId === this.getId() && evt.isSourceLoaded) {
            this.updateClustersThrottled()
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
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(id, 'circle-opacity', opacity)
            mapgl.setPaintProperty(id, 'circle-stroke-opacity', opacity)

            if (this.isDonutClusters()) {
                for (const id in this.clusters) {
                    this.clusters[id].getElement().style.opacity = opacity
                }
            } else {
                mapgl.setPaintProperty(
                    `${id}-clusters`,
                    'circle-opacity',
                    opacity
                )
                mapgl.setPaintProperty(
                    `${id}-clusters`,
                    'circle-stroke-opacity',
                    opacity
                )
                mapgl.setPaintProperty(`${id}-count`, 'text-opacity', opacity)
            }
        }

        this.options.opacity = opacity
    }

    zoomToCluster = (clusterId, center) => {
        const mapgl = this.getMapGL()
        const source = mapgl.getSource(this.getId())

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error) return
            mapgl.easeTo({ center, zoom: zoom + 1 })
        })
    }
}

export default ClientCluster
