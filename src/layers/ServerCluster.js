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

const merc = new SphericalMercator({
    size: 512,
})

const clusterSize = 110 // TODO

// TODO: https://github.com/dhis2/maps-gl/blob/layer-handling/src/layers/ServerCluster.js
class ServerCluster extends Cluster {
    currentTiles = []
    tileClusters = {}
    cluserCount = 0

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
        Promise.all(nonPendingTiles.map(this.loadTile)).then(
            this.updateClusters
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
    getResolution(zoom) {
        return (Math.PI * earthRadius * 2) / 256 / Math.pow(2, zoom)
    }

    getTileParams(tileId) {
        const [z, x, y] = tileId.split('/')
        // const { clusterSize } = this.options
        const mapgl = this._map.getMapGL()

        return {
            tileId: tileId,
            bbox: merc.bbox(x, y, z).join(','),
            clusterSize: Math.round(this.getResolution(z) * clusterSize),
            includeClusterPoints: Number(z) === mapgl.getMaxZoom(),
        }
    }

    updateClusters = () => {
        const source = this.getMapGL().getSource(this.getId())

        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: this.getVisibleClusters(),
            })
        }
    }

    onClick = evt => {
        const { feature } = evt
        const { cluster, bounds, points } = feature.properties

        if (cluster) {
            if (points) {
                this.spiderfy(feature)
            } else {
                this.zoomToBounds(bounds)
            }
        } else {
            console.log('Single feature', points)
        }
    }

    onAdd() {
        super.onAdd()

        const mapgl = this._map.getMapGL()
        mapgl.on('moveend', this.onMoveEnd)

        this.onMoveEnd()
    }

    onMoveEnd = () => {
        const tiles = this.getVisibleTiles()

        if (tiles.join('-') !== this.currentTiles.join('-')) {
            this.currentTiles = tiles
            this.loadTiles(tiles)
        } else {
            console.log('No change')
        }
    }

    getVisibleTiles = () => {
        const mapgl = this._map.getMapGL()
        const sourceCache = mapgl.style.sourceCaches[this.getId()]

        if (!sourceCache && !sourceCache._tiles) {
            return []
        }

        return Object.values(sourceCache._tiles)
            .map(this.getTileId)
            .sort()
    }

    getVisibleClusters = () =>
        [].concat(...this.getVisibleTiles().map(this.getTileClusters))

    getTileClusters = tileId => {
        const clusters = this.tileClusters[tileId]
        return Array.isArray(clusters) ? clusters : []
    }

    setOpacity(opacity) {}

    zoomToBounds(bounds) {
        if (bounds) {
            const mapgl = this._map.getMapGL()

            // TODO: Conversion in maps app?
            const [ll, ur] = JSON.parse(bounds)
            mapgl.fitBounds([ll.reverse(), ur.reverse()])
        }
    }

    spiderfy(feature) {
        const { geometry, properties } = feature
        const { points } = properties

        // TODO: Upper limit for properties to show?
        // TODO: We don't support polygons in spiders
        const features = points.split(',').map(id => ({
            type: 'Feature',
            id,
            geometry,
            properties: {
                id,
            },
        }))

        this.spider.spiderfy(123, geometry.coordinates, features)

        // console.log('spiderfy', features)
    }
}

export default ServerCluster
