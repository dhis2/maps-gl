import SphericalMercator from '@mapbox/sphericalmercator'
import centroid from '@turf/centroid'
import { isClusterPoint } from '../utils/filters'
import { earthRadius } from '../utils/geo'
import { featureCollection } from '../utils/geometry'
import {
    pointLayer,
    polygonLayer,
    outlineLayer,
    clusterLayer,
    clusterCountLayer,
} from '../utils/layers'
import { eventStrokeColor, clusterCountColor } from '../utils/style'
import Cluster from './Cluster'

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
        const {
            fillColor: color,
            strokeColor = eventStrokeColor,
            countColor = clusterCountColor,
            radius,
        } = this.options
        const isInteractive = true

        // Non-clustered points
        this.addLayer(
            pointLayer({
                id,
                color,
                strokeColor,
                radius,
                filter: isClusterPoint,
            }),
            { isInteractive }
        )

        // Non-clustered polygons
        this.addLayer(polygonLayer({ id, color }), { isInteractive })
        this.addLayer(outlineLayer({ id, color: strokeColor }))

        // Clusters
        this.addLayer(clusterLayer({ id, color, strokeColor }), {
            isInteractive,
        })
        this.addLayer(clusterCountLayer({ id, color: countColor }))
    }

    getTileId(tile) {
        const { x, y, z } = tile.tileID.canonical
        return `${z}/${x}/${y}`
    }

    // Meters per pixel
    getResolution = (zoom) =>
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
    updateClusters = (tiles) => {
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

    onClick = (evt) => {
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

        const mapgl = this._map.getMapGL()
        mapgl.on('sourcedata', this.onSourceData)
        mapgl.on('moveend', this.onMoveEnd)
    }

    onRemove() {
        super.onRemove()

        const mapgl = this._map.getMapGL()

        if (mapgl) {
            mapgl.off('sourcedata', this.onSourceData)
            mapgl.off('moveend', this.onMoveEnd)
        }
    }

    // Load clusters when new tiles are requested
    onSourceData = (evt) => {
        if (evt.sourceId === this.getId() && evt.tile) {
            const tileId = this.getTileId(evt.tile)

            if (!this.tileClusters[tileId]) {
                this.tileClusters[tileId] = 'pending'
                this._isLoading = true
                this.options.load(this.getTileParams(tileId), this.onTileLoad)
            }
        }
    }

    onMoveEnd = async () => {
        const tiles = await this.getVisibleTiles()

        if (tiles.join('-') !== this.currentTiles.join('-')) {
            this.currentTiles = tiles

            const cachedTiles = tiles.filter((id) =>
                Array.isArray(this.tileClusters[id])
            )

            if (cachedTiles.length) {
                this.updateClusters(cachedTiles)
            }
        }
    }

    // Keep tile clusters in memory and update map if needed
    onTileLoad = async (tileId, clusters) => {
        this.tileClusters[tileId] = clusters

        // Check if tile is still visible after loading
        const visibleTiles = await this.getVisibleTiles()

        if (visibleTiles.includes(tileId)) {
            this.updateClusters([tileId])
        }

        this._isLoading = false
    }

    getBounds = () => this.options.bounds

    // Returns true if all tiles aligns with the zoom level
    areTilesUpdated = () => {
        const mapgl = this._map.getMapGL()
        const zoom = Math.floor(mapgl.getZoom())

        return this.getSourceCacheTiles().every(
            ({ tileID }) => tileID.canonical.z === zoom
        )
    }

    getSourceCacheTiles = () => {
        const mapgl = this._map.getMapGL()
        const sourceCache = mapgl.style.sourceCaches[this.getId()]

        return sourceCache ? Object.values(sourceCache._tiles) : []
    }

    // Called by parent class
    getClusterFeatures = (clusterId) => {
        const cluster = this.currentClusters.find((c) => c.id === clusterId)

        if (cluster) {
            return cluster.properties.id
                .split(',')
                .slice(0, this.options.maxSpiderSize)
                .map((id) => ({
                    type: 'Feature',
                    id,
                    geometry: cluster.geometry,
                    properties: {
                        id,
                    },
                }))
        }
    }

    // Returms true if geometry is outside bounds
    isOutsideBounds =
        (bounds) =>
        ({ geometry }) => {
            const { coordinates } =
                geometry.type === 'Point'
                    ? geometry
                    : centroid(geometry).geometry
            const [lng, lat] = coordinates

            return (
                lng <= bounds[0] ||
                lng >= bounds[2] ||
                lat <= bounds[1] ||
                lat >= bounds[3]
            )
        }

    getVisibleTiles = async () => {
        while (!this.areTilesUpdated()) {
            await new Promise((r) => setTimeout(r, 100))
        }

        return this.getSourceCacheTiles().map(this.getTileId).sort()
    }

    // Returns sorted array of cluster ids
    getClusterIds = (clusters) =>
        clusters
            .map((c) => c.id)
            .sort((a, b) => a - b)
            .join()

    zoomToBounds(bounds) {
        if (bounds) {
            let zoomBounds

            if (Array.isArray(bounds)) {
                zoomBounds = bounds
            } else if (typeof bounds === 'string') {
                // https://github.com/mapbox/mapbox-gl-js/issues/2434
                try {
                    zoomBounds = JSON.parse(bounds)
                } catch (evt) {
                    return
                }
            }

            if (zoomBounds) {
                this._map.getMapGL().fitBounds(zoomBounds, {
                    padding: 40,
                })
            }
        }
    }
}

export default ServerCluster
