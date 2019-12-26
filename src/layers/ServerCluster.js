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
            maxSpiderSize: 50,
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
        // console.log(`tile ${z}/${x}/${y}`)
        return `${z}/${x}/${y}`
    }

    // Meters per pixel
    getResolution(zoom) {
        return (Math.PI * earthRadius * 2) / 256 / Math.pow(2, zoom)
    }

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

    // TODO: Pass in tile id / bounds and only replace clusters within bounds
    updateClusters = tileId => {
        // Only update if the tile is still visible
        if (this.isTileVisible(tileId)) {
            const zoom = this.getZoom()
            const tileClusters = this.tileClusters[tileId]
            let clusters = []

            if (
                // zoom !== this.currentZoom &&
                tileClusters.length &&
                this.currentClusters.length
            ) {
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

            // console.log('Visible tile', tileId)

            // Replace clusters within the same bounds

            // console.log('updateClusters', tileId, this.tileClusters[tileId])

            const source = this.getMapGL().getSource(this.getId())

            if (!clusters.length) {
                // console.log('##### NO CLUSTERS')
            }

            if (this.currentClusterIds !== clusterIds) {
                this.currentClusterIds = clusterIds
                // console.log('UPDATE CLUSTERS', clusterIds)

                source.setData({
                    type: 'FeatureCollection',
                    features: clusters,
                })

                this.currentClusters = clusters
                // this.currentZoom = zoom
            } else {
                // console.log('#### SAME CLUSTERS')
            }
        } else {
            // console.log('Tile not visible', tileId)
        }
    }

    onClick = evt => {
        const { feature } = evt
        const { cluster, bounds, id } = feature.properties

        if (cluster) {
            if (id) {
                this.spiderfy(feature)
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
    }

    onSourceData = evt => {
        const { sourceId } = evt
        const mapgl = this._map.getMapGL()

        // TODO: Better way to know that source tiles are available?
        if (sourceId === this.getId() && this.getSourceCacheTiles().length) {
            mapgl.off('sourcedata', this.onSourceData)
            mapgl.on('moveend', this.onMoveEnd)
            this.onMoveEnd()
        }
    }

    onMoveEnd = () => {
        const tiles = this.getVisibleTiles()

        if (tiles.join('-') !== this.currentTiles.join('-')) {
            this.currentTiles = tiles
            this.loadTiles(tiles)
        }
    }

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

    spiderfy(feature) {
        const { geometry, properties } = feature

        // TODO: We don't support polygons in spiders
        const features = properties.id
            .split(',')
            .slice(0, this.options.maxSpiderSize)
            .map(id => ({
                type: 'Feature',
                id,
                geometry,
                properties: {
                    id,
                },
            }))

        this.spider.spiderfy(feature.id, geometry.coordinates, features)
    }

    // TODO: Share method with client cluster?
    setClusterOpacity(clusterId, isExpanded) {
        // console.log('setClusterOpacity', clusterId, isExpanded)
        if (clusterId) {
            const { opacity } = this.options

            this.getMapGL().setPaintProperty(
                `${this.getId()}-clusters`,
                'circle-opacity',
                isExpanded && opacity >= 0.1
                    ? [
                          'case',
                          ['==', ['get', 'cluster_id'], clusterId],
                          0.1,
                          opacity,
                      ]
                    : opacity
            )
        }
    }
}

export default ServerCluster
