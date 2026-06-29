import throttle from 'lodash.throttle'
import { featureCollection } from '../utils/geometry.js'
import Cluster from './Cluster.js'
import DonutMarker from './DonutMarker.js'

const segmentRow = (segment, total, formatCount) => {
    const pct = Math.round((segment.count / total) * 100)
    const count = formatCount ? formatCount(segment.count) : segment.count
    return (
        `<div style="display:flex;align-items:center;gap:6px;padding:1px 0">` +
        `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${segment.color};flex-shrink:0"></span>` +
        `<span>${pct}% (${count})</span>` +
        `</div>`
    )
}

class DonutCluster extends Cluster {
    clusters = {}
    clustersOnScreen = {}
    _showTooltipTimer = null
    _hideTooltipTimer = null

    createSource() {
        super.createSource({
            cluster: true,
            clusterProperties: this.options.groups.reduce((obj, group, i) => {
                const cg = group.colorGroup ?? i
                if (process.env.NODE_ENV !== 'production' && obj[`g${cg}`]) {
                    console.warn(
                        `DonutCluster: duplicate colorGroup key g${cg}`
                    )
                }
                obj[`g${cg}`] = [
                    '+',
                    ['case', ['==', ['get', 'colorGroup'], cg], 1, 0],
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
        clearTimeout(this._showTooltipTimer)
        clearTimeout(this._hideTooltipTimer)

        super.onRemove()

        const mapgl = this.getMapGL()

        if (mapgl) {
            mapgl.off('sourcedata', this.onSourceData)
            mapgl.off('move', this.updateClusters)
            mapgl.off('moveend', this.updateClusters)
        }

        for (const id in this.clustersOnScreen) {
            this.clusters[id]?._listenerAc?.abort()
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
        const { groups, opacity, sortSegments, formatCount } = this.options
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
                const segments = groups.map((group, i) => ({
                    ...group,
                    count: properties[`g${group.colorGroup ?? i}`] || 0,
                }))

                cluster = new DonutMarker(segments, {
                    opacity,
                    label: properties.point_count_abbreviated,
                })

                cluster.setLngLat(coordinates)
                cluster.on('click', () => {
                    this.zoomToCluster(cluster_id, coordinates)
                })

                const total = properties.point_count
                const map = this._map
                const ac = new AbortController()
                const { signal } = ac
                cluster.getElement().addEventListener(
                    'mouseover',
                    () => {
                        clearTimeout(this._hideTooltipTimer)
                        clearTimeout(this._showTooltipTimer)
                        this._showTooltipTimer = setTimeout(() => {
                            const filtered = segments.filter(s => s.count > 0)
                            const visible = sortSegments
                                ? sortSegments(filtered)
                                : filtered
                            const rows = visible
                                .map(s => segmentRow(s, total, formatCount))
                                .join('')
                            const html = `<div>${rows}</div>`
                            map.showLabel(html, cluster.getLngLat(), {
                                isHTML: true,
                            })
                        }, 150)
                    },
                    { signal }
                )
                cluster.getElement().addEventListener(
                    'mouseleave',
                    () => {
                        clearTimeout(this._showTooltipTimer)
                        this._hideTooltipTimer = setTimeout(
                            () => map.hideLabel(),
                            150
                        )
                    },
                    { signal }
                )
                cluster._listenerAc = ac

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
                this.clusters[id]?._listenerAc?.abort()
                this.clustersOnScreen[id].remove()
                delete this.clusters[id]
            }
        }
        this.clustersOnScreen = newClusters

        if (this._hasPolygons) {
            this.updatePolygons()
        }
    }, 100)
}

export default DonutCluster
