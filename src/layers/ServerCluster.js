import Layer from './Layer'
import SphericalMercator from '@mapbox/sphericalmercator'

const earthRadius = 6378137

const merc = new SphericalMercator({
    size: 512,
})

class ServerCluster extends Layer {
    constructor(options) {
        super({
            clusterSize: 110,
            ...options,
        })

        this._currentTiles = []
        this._tileClusters = {} // Cluster cache

        const { fillColor, radius } = options
        this.createSource()
        this.createLayers(fillColor, radius)
    }

    createSource() {
        const id = this.getId()

        this.setSource(id, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [],
            },
        })
    }

    createLayers(color, radius) {
        const id = this.getId()

        this.addLayer({
            id: `${id}-clusters`,
            type: 'circle',
            source: id,
            paint: {
                'circle-color': color,
                'circle-radius': [
                    'step',
                    ['get', 'count'],
                    15,
                    10,
                    20,
                    1000,
                    25,
                    10000,
                    30,
                ],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff',
            },
            filter: ['>', 'count', 1],
        })

        this.addLayer({
            id: `${id}-count`,
            type: 'symbol',
            source: id,
            layout: {
                'text-field': '{count}',
                'text-font': ['Open Sans Bold'],
                'text-size': 16,
            },
            paint: {
                'text-color': '#fff',
            },
            filter: ['>', 'count', 1],
        })

        this.addLayer({
            id: `${id}`,
            type: 'circle',
            source: id,
            paint: {
                'circle-color': 'red',
                'circle-radius': 10,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff',
            },
            filter: ['==', 'count', 1],
        })
    }

    // Add clusters for one tile
    addClusters(tileId, clusters) {
        this._tileClusters[tileId] = clusters
        this._tiles[tileId] = 'loaded'

        console.log('addClusters', tileId, clusters, this.clusterSource)
    }

    loadTiles(tiles) {
        const nonPendingTiles = tiles.filter(
            id => this._tileClusters[id] !== 'pending'
        )
        Promise.all(nonPendingTiles.map(this.loadTile)).then(
            this.updateClusters
        )
    }

    // TODO: Error handling
    loadTile = tileId =>
        new Promise((resolve, reject) => {
            const cache = this._tileClusters
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
        const { clusterSize } = this.options
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
            console.log('setData')
        }
    }

    onAdd() {
        const mapgl = this._map.getMapGL()
        mapgl.on('moveend', this.onMoveEnd)

        this.onMoveEnd()
    }

    onMoveEnd = () => {
        const tiles = this.getVisibleTiles()

        if (tiles.join('-') !== this._currentTiles.join('-')) {
            this._currentTiles = tiles
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
        const clusters = this._tileClusters[tileId]
        return Array.isArray(clusters) ? clusters : []
    }
}

export default ServerCluster
