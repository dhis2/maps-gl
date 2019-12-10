import { Evented } from 'mapbox-gl'
// import { Event } from 'mapbox-gl/src/util/evented'; // Requires a loader
import Layer from './Layer'

export const SERVER_CLUSTER_TYPE = 'servercluster'

// https://github.com/mapbox/mapbox-gl-js/issues/3004
// https://github.com/mapbox/mapbox-gl-js/issues/2920
// https://github.com/mapbox/mapbox-gl-js/pull/2667
// https://github.com/mapbox/mapbox-gl-js/projects/2

export const loadServerCluster = (options, callback) => {
    console.log('# loadServerCluster', options, callback)
}

// https://github.com/maphubs/mapbox-gl-arcgis-tiled-map-service
export class ServerClusterSource extends Evented {
    constructor(id, options, dispatcher, eventedParent) {
        super()
        console.log(
            '#ServerClusterSource',
            id,
            options,
            dispatcher,
            eventedParent
        )
        this.id = id
        this.type = SERVER_CLUSTER_TYPE
        this.minzoom = 0
        this.maxzoom = 22
        this.roundZoom = true
        this.tileSize = 512
        this._loaded = false

        this._options = {
            type: SERVER_CLUSTER_TYPE,
            ...options,
        }
    }

    load() {
        this._loaded = false
        // this.fire(new Event('dataloading', {dataType: 'source'}));

        loadServerCluster(this._options, console.log)

        console.log('#load')
    }

    loaded() {
        return this._loaded
    }

    onAdd(map) {
        console.log('#onAdd', map)
        this.map = map
        this.load()
    }

    onRemove() {
        console.log('#onRemove')
    }

    hasTile(tileID) {
        console.log('#hasTile', tileID)
        // return !this.tileBounds || this.tileBounds.contains(tileID.canonical);
        return false
    }

    loadTile(tile, callback) {
        console.log('#loadTile', tile, callback)
    }

    abortTile(tile, callback) {
        console.log('#abortTile', tile, callback)
    }

    unloadTile(tile, callback) {
        console.log('#unloadTile', tile, callback)
    }

    serialize() {
        return { ...this._options }
    }

    hasTransition() {
        return false
    }
}

class ServerCluster extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayer()

        // console.log('ServerCluster', options)
    }

    createSource() {
        const id = this.getId()

        // https://docs.mapbox.com/mapbox-gl-js/style-spec/#sources
        this.setSource(id, {
            ...this.options,
            type: SERVER_CLUSTER_TYPE,
        })

        console.log('createSource', id, this.options)
    }

    createLayer() {
        this.addLayer({
            id: this.getId(),
            type: 'circle',
            source: this.getId(),
        })

        console.log('createLayer')
    }
}

export default ServerCluster
