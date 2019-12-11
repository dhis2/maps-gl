import Layer from './Layer'
import SphericalMercator from '@mapbox/sphericalmercator'

const earthRadius = 6378137

const merc = new SphericalMercator({
    size: 512,
})

// Extends a method on an object
const extendMethod = (obj, name, func) =>
    (obj[name] = (original => (...args) => {
        original.apply(obj, args)
        func(...args)
    })(obj[name]))

class ServerCluster extends Layer {
    constructor(options) {
        super({
            clusterSize: 110,
            ...options,
        })

        this._tiles = {} // Visible tiles
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
            // workerOptions: {},
            // loadData: () => console.log("Load data"),
        })

        setTimeout(() => {
            const mapgl = this._map.getMapGL()
            const source = mapgl.getSource(id)

            this.clusterSource = source // TODO

            mapgl.showTileBoundaries = true

            mapgl.on('moveend', () => {
                const sourceCache = mapgl.style.sourceCaches[this.getId()]
                const tiles = Object.values(sourceCache._tiles).map(
                    this.getTileId
                )

                console.log('moveend', Math.floor(mapgl.getZoom()), tiles)
            })

            // console.log('sourceCache', sourceCache);
            // console.log('###', source.getVis);

            // https://github.com/mapbox/mapbox-gl-js/blob/master/src/source/geojson_source.js
            // source.loadTile = this.loadTile.bind(this)
            // source.unloadTile = this.unloadTile.bind(this)
            // source.abortTile = this.abortTile.bind(this)
            /*
            extendMethod(source, 'loadTile', this.loadTile.bind(this))
            extendMethod(source, 'unloadTile', this.unloadTile.bind(this))
            extendMethod(source, 'abortTile', this.abortTile.bind(this))
            */
        }, 1000)
    }

    createLayers(color, radius) {
        const id = this.getId()

        this.addLayer({
            id: `${id}`,
            type: 'circle',
            source: id,
            paint: {
                'circle-color': color,
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
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
        })
    }

    // Add clusters for one tile
    addClusters(tileId, clusters) {
        this._tileClusters[tileId] = clusters
        this._tiles[tileId] = 'loaded'

        console.log('addClusters', tileId, clusters, this.clusterSource)
    }

    loadTile(tile) {
        const tileId = this.getTileId(tile)

        if (!this._tiles[tileId]) {
            this._tiles[tileId] = 'loading'
            const mapgl = this._map.getMapGL()
            const { x, y, z } = tile.tileID.canonical
            const { clusterSize, load } = this.options

            const params = {
                tileId: tileId,
                bbox: merc.bbox(x, y, z).join(','),
                clusterSize: Math.round(this.getResolution(z) * clusterSize),
                includeClusterPoints: z === mapgl.getMaxZoom(),
            }

            load(params, this.addClusters.bind(this))
        }
    }

    unloadTile(tile) {
        const tileId = this.getTileId(tile)
        // console.log('############# unloadTile', tileId)
        delete this._tiles[tileId]
        console.log('###', this._tiles)
    }

    abortTile(tile) {
        const tileId = this.getTileId(tile)
        // console.log('############# abortTile', tileId)
        delete this._tiles[tileId]
        console.log('###', this._tiles)
    }

    getTileId(tile) {
        const { x, y, z } = tile.tileID.canonical
        return `${z}/${x}/${y}`
    }

    // Meters per pixel
    getResolution(zoom) {
        return (Math.PI * earthRadius * 2) / 256 / Math.pow(2, zoom)
    }
}

export default ServerCluster
