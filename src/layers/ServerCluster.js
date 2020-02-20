import SphericalMercator from '@mapbox/sphericalmercator'
import centroid from '@turf/centroid'
import Cluster from './Cluster'
import { pointLayer, polygonLayer, outlineLayer } from '../utils/layers'
import { isCluster, isClusterPoint } from '../utils/filters'
import { featureCollection } from '../utils/geometry'
import {
    outlineColor,
    outlineWidth,
    clusterRadius,
    textFont,
    textSize,
    textColor,
} from '../utils/style'

const earthRadius = 6378137

class ServerCluster extends Cluster {
    currentTiles = []
    currentClusters = []
    currentClusterIds = ''
    currentZoom = 0
    tileClusters = {}
    cluserCount = 0

    constructor(options) {
        super({
            tileSize: 512,
            clusterSize: 110,
            maxSpiderSize: 500,
            debug: true,
            ...options,
        })

        const merc = new SphericalMercator({
            size: this.options.tileSize,
        })

        this.getTileBounds = (x, y, z) => merc.bbox(x, y, z)
    }

    createSource() {
        super.createSource({
            data: featureCollection(),
        })
    }

    createLayers() {
        const id = this.getId()
        const { fillColor: color, radius } = this.options

        // Non-clustered points
        this.addLayer(pointLayer({ id, color, radius, filter: isClusterPoint }), true)

        // Non-clustered polygons
        this.addLayer(polygonLayer({ id, color }), true)
        this.addLayer(outlineLayer({ id }))

        this.addLayer(
            {
                id: `${id}-cluster`,
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

    getTileId(tile) {
        const { x, y, z } = tile.tileID.canonical
        return `${z}/${x}/${y}`
    }

    // Meters per pixel
    getResolution = zoom =>
        (Math.PI * earthRadius * 2) / this.options.tileSize / Math.pow(2, zoom)

    getTileParams(tileId) {
        const [z, x, y] = tileId.split('/')
        const { clusterSize } = this.options
        const mapgl = this._map.getMapGL()

        return {
            tileId: tileId,
            bbox: this.getTileBounds(x, y, z).join(','),
            clusterSize: Math.round(this.getResolution(z) * clusterSize),
            includeClusterPoints: Number(z) === mapgl.getMaxZoom(),
        }
    }

    // Replace clusters within the same tile bounds
    updateClusters = tiles => {
        const clusters = tiles.reduce((newClusters, tileId) => {
            const [z, x, y] = tileId.split('/')
            const isOutsideBounds = this.isOutsideBounds(
                this.getTileBounds(x, y, z)
            )

            return [
                ...newClusters.filter(isOutsideBounds),
                ...this.tileClusters[tileId],
            ]
        }, this.currentClusters)

        const clusterIds = this.getClusterIds(clusters)

        if (this.currentClusterIds !== clusterIds) {
            const source = this.getMapGL().getSource(this.getId())

            source.setData(featureCollection(clusters))

            this.currentClusterIds = clusterIds
            this.currentClusters = clusters
        }
    }

    onClick = evt => {
        const { geometry, properties } = evt.feature
        const { cluster, bounds, id, cluster_id } = properties

        if (cluster) {
            if (id) {
                this.spiderfy(cluster_id, geometry.coordinates)
            } else {
                this.zoomToBounds(bounds)
            }
        } else {
            this.fire('click', evt)
        }
    }

    onAdd() {
        super.onAdd()

        const map = this._map.getMapGL()
        map.on('sourcedata', this.onSourceData)
        map.on('moveend', this.onMoveEnd)
    }

    onRemove() {
        super.onRemove()

        const map = this._map.getMapGL()
        map.off('sourcedata', this.onSourceData)
        map.off('moveend', this.onMoveEnd)
    }

    // Load clusters when new tiles are requested
    onSourceData = evt => {
        if (evt.sourceId === this.getId() && evt.tile) {
            const tileId = this.getTileId(evt.tile)

            if (!this.tileClusters[tileId]) {
                this.tileClusters[tileId] = 'pending'
                this.options.load(this.getTileParams(tileId), this.onTileLoad)
            }
        }
    }

    onMoveEnd = () => {
        const tiles = this.getVisibleTiles()

        if (tiles.join('-') !== this.currentTiles.join('-')) {
            this.currentTiles = tiles

            const cachedTiles = tiles.filter(id =>
                Array.isArray(this.tileClusters[id])
            )

            if (cachedTiles.length) {
                this.updateClusters(cachedTiles)
            }
        }
    }

    // Keep tile clusters in memory and update map if needed
    onTileLoad = (tileId, clusters) => {
        this.tileClusters[tileId] = clusters

        // If tile still visible after loading
        if (this.isTileVisible(tileId)) {
            this.updateClusters([tileId])
        }
    }

    getBounds = () => this.options.bounds

    getSourceCacheTiles = () => {
        const mapgl = this._map.getMapGL()
        return Object.values(mapgl.style.sourceCaches[this.getId()]._tiles)
    }

    // Called by parent class
    getClusterFeatures = clusterId => {
        const cluster = this.currentClusters.find(c => c.id === clusterId)

        if (cluster) {
            return cluster.properties.id
                .split(',')
                .slice(0, this.options.maxSpiderSize)
                .map(id => ({
                    type: 'Feature',
                    id,
                    geometry: cluster.geometry,
                    properties: {
                        id,
                    },
                }))
        }
    }

    isTileVisible = tileId => this.getVisibleTiles().includes(tileId)

    // TODO: Could be static 
    isOutsideBounds = bounds => ({ geometry }) => {
        const { coordinates } = geometry.type === 'Point' ? geometry : centroid(geometry).geometry
        const [lng, lat] = coordinates

        return (
            lng <= bounds[0] ||
            lng >= bounds[2] ||
            lat <= bounds[1] ||
            lat >= bounds[3]
        )
    }

    getVisibleTiles = () =>
        this.getSourceCacheTiles()
            .map(this.getTileId)
            .sort()

    // TODO: Could be static
    getClusterIds = clusters =>
        clusters
            .map(c => c.id)
            .sort((a, b) => a - b)
            .join()

    zoomToBounds(bounds) {
        if (bounds) {
            // https://github.com/mapbox/mapbox-gl-js/issues/2434
            const zoomBounds =
                typeof bounds === 'string' ? JSON.parse(bounds) : bounds // TODO: Error handling

            this._map.getMapGL().fitBounds(zoomBounds, {
                padding: 40,
            })
        }
    }
}

export default ServerCluster
