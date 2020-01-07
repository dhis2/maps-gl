import { LngLat } from 'mapbox-gl'
import SphericalMercator from '@mapbox/sphericalmercator'
import Cluster from './Cluster'
import { isCluster } from '../utils/filters'
import {
    outlineColor,
    outlineWidth,
    clusterRadius,
    textFont,
    textSize,
    textColor,
} from '../utils/style'

const earthRadius = 6378137

// TODO: https://github.com/dhis2/maps-gl/blob/layer-handling/src/layers/ServerCluster.js
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
            data: {
                type: 'FeatureCollection',
                features: [],
            },
        })
    }

    createLayers(color, radius) {
        super.createLayers(color, radius)

        const id = this.getId()

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

    // Add clusters for one tile
    addClusters(tileId, clusters) {
        this.tileClusters[tileId] = clusters
        this._tiles[tileId] = 'loaded'
    }

    loadTiles(tiles) {
        const nonPendingTiles = tiles.filter(
            id => this.tileClusters[id] !== 'pending'
        )

        nonPendingTiles.forEach(tileId =>
            this.loadTile(tileId).then(this.updateClusters)
        )
    }

    // TODO: Error handling
    loadTile = tileId =>
        new Promise((resolve, reject) => {
            const cache = this.tileClusters
            const tileCache = cache[tileId]

            if (Array.isArray(tileCache)) {
                resolve(tileId)
            } else {
                cache[tileId] = 'pending'

                this.options.load(
                    this.getTileParams(tileId),
                    (id, clusters) => {
                        cache[id] = clusters
                        resolve(id)
                    }
                )
            }
        })

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

    updateClusters = tileId => {
        // Only update if the tile is still visible
        if (this.isTileVisible(tileId)) {
            const zoom = this.getZoom()
            const tileClusters = this.tileClusters[tileId]
            let clusters = []

            if (tileClusters.length && this.currentClusters.length) {
                const [z, x, y] = tileId.split('/')
                const tileBounds = this.getTileBounds(x, y, z)
                const isOutsideBounds = this.isOutsideBounds(tileBounds)

                clusters = [
                    ...this.currentClusters.filter(isOutsideBounds),
                    ...tileClusters,
                ]
            } else {
                clusters = this.getVisibleClusters()
            }

            const clusterIds = this.getClusterIds(clusters)

            const source = this.getMapGL().getSource(this.getId())

            if (this.currentClusterIds !== clusterIds) {
                this.currentClusterIds = clusterIds

                source.setData({
                    type: 'FeatureCollection',
                    features: clusters,
                })

                this.currentClusters = clusters
            }
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

    onSourceData = evt => {
        if (evt.sourceId === this.getId() && evt.tile) {
            const tileId = this.getTileId(evt.tile)

            if (!this.tileClusters[tileId]) {
                this.loadTile(tileId).then(this.updateClusters)
            }
        }
    }

    onMoveEnd = () => {
        const tiles = this.getVisibleTiles()

        if (tiles.join('-') !== this.currentTiles.join('-')) {
            this.currentTiles = tiles

            // const isPending = tiles.some(id => this.tileClusters[id] === 'pending')

            // if (!isPending) {
            const cachedTiles = tiles.filter(id =>
                Array.isArray(this.tileClusters[id])
            )

            // TODO: Update clusters in one go
            cachedTiles.forEach(this.updateClusters)
            // }
        }
    }

    areTilesReady = () =>
        this.getSourceCacheTiles().every(tile => tile.state === 'loaded')

    getBounds() {
        const { bounds } = this.options

        if (bounds) {
            const [ll, ur] = bounds
            return [ll.reverse(), ur.reverse()] // TODO
        } else {
            // TODO
        }
    }

    getZoom = () => Math.floor(this._map.getMapGL().getZoom())

    getSourceCacheTiles = () => {
        const mapgl = this._map.getMapGL()
        return Object.values(mapgl.style.sourceCaches[this.getId()]._tiles)
    }

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

    // Could be static - use <=?
    isOutsideBounds = bounds => feature => {
        const [lng, lat] = feature.geometry.coordinates
        return (
            lng < bounds[0] ||
            lng > bounds[2] ||
            lat < bounds[1] ||
            lat > bounds[3]
        )
    }

    getVisibleTiles = () =>
        this.getSourceCacheTiles()
            .map(this.getTileId)
            .sort()

    getVisibleClusters = () =>
        [].concat(...this.getVisibleTiles().map(this.getTileClusters))

    getTileClusters = tileId => {
        const clusters = this.tileClusters[tileId]
        return Array.isArray(clusters) ? clusters : []
    }

    getClusterIds = clusters =>
        clusters
            .map(c => c.id)
            .sort((a, b) => a - b)
            .join()

    setOpacity(opacity) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(`${id}-clusters`, 'circle-opacity', opacity)
            mapgl.setPaintProperty(
                `${id}-clusters`,
                'circle-stroke-opacity',
                opacity
            )
            mapgl.setPaintProperty(`${id}-count`, 'text-opacity', opacity)
        }

        super.setOpacity(opacity)
    }

    zoomToBounds(bounds) {
        if (bounds) {
            const mapgl = this._map.getMapGL()

            // TODO: Conversion in maps app?
            const [ll, ur] = JSON.parse(bounds)
            mapgl.fitBounds([ll.reverse(), ur.reverse()], {
                padding: 40,
            })
        }
    }
}

export default ServerCluster
