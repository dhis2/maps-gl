import { getZoomResolution, getTileBBox } from '../utils/geo'
import Layer from './Layer'

// https://github.com/mapbox/mapbox-gl-js/projects/2
// https://github.com/mapbox/mapbox-gl-js/blob/master/src/source/source_cache.js
// https://github.com/mapbox/mapbox-gl-js/blob/master/src/render/draw_raster.js
// https://github.com/mapbox/mapbox-gl-js/blob/master/src/source/tile.js
// https://github.com/mapbox/mapbox-gl-js/pull/2667
// https://github.com/mapbox/mapbox-gl-js/issues/2120
// https://github.com/mapbox/mapbox-gl-js/issues/3051
// https://github.com/mapbox/mapbox-gl-js/issues/3326

const earthRadius = 6378137

class ServerCluster extends Layer {
    constructor(options) {
        super(options)

        this._tileClusters = {} // Cluster cache

        this.createSource()
        this.createLayers()
    }

    createSource() {
        const id = this.getId()

        // console.log('Server cluster', id)

        this.setSource(id, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [],
            },
        })
    }

    createLayers() {
        const id = this.getId()

        // Non-clustered points
        this.addLayer(
            {
                id,
                type: 'circle',
                source: id,
                paint: {
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#fff',
                },
            },
            true
        )
    }

    onAdd() {
        const mapgl = this.getMapGL()
        const source = mapgl.getSource(this.getId())
        this._tiles = mapgl.painter.style.sourceCaches[this.getId()]._tiles // TODO: Better way to access?
        this._tileSize = source.tileSize

        mapgl.showTileBoundaries = true // TODO: Remove

        mapgl.on('moveend', this.onMoveEnd)
    }

    onMoveEnd = () => {
        for (const id in this._tiles) {
            this.loadTileClusters(this._tiles[id].tileID.canonical)
        }
    }

    loadTileClusters(tile) {
        const { z, x, y, key } = tile
        const clusters = this._tileClusters[key]

        if (clusters) {
            this.addTileClusters(key, clusters)
            return
        }

        const { load, clusterSize = 110 } = this.options

        const params = {
            tileId: key,
            bbox: getTileBBox(x, y, z),
            clusterSize: Math.round(getZoomResolution(z) * clusterSize),
            includeClusterPoints: this.isMaxZoom(),
        }

        // console.log(params)

        load(params, this.addTileClusters)
    }

    addTileClusters = (tileId, clusters) => {
        this._tileClusters[tileId] = clusters

        if (clusters.length) {
            console.log('addTileClusters', tileId, clusters.length, clusters)
        }
    }

    isMaxZoom() {
        const mapgl = this.getMapGL()
        return mapgl.getZoom() === mapgl.getMaxZoom()
    }
}

export default ServerCluster
