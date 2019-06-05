import throttle from 'lodash.throttle'
import { getZoomResolution, getTileBBox } from '../utils/geo'
import { formatCount } from '../utils/numbers'
import Layer from './Layer'
import { isPoint, isPolygon, isCluster, noCluster } from '../utils/filters'
import {
    outlineColor,
    outlineWidth,
    clusterRadius,
    textFont,
    textSize,
} from '../utils/style'

// TODO: Support event polygons
// TODO: Spiderify
class ServerCluster extends Layer {
    constructor(options) {
        super(options)

        this._clusters = [] // Clusters shown on map
        this._tileClusters = {} // Cluster cache

        this.createSource()
        this.createLayers()

        this.updateClustersThrottled = throttle(this.updateClusters, 100)
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

    createLayers() {
        const id = this.getId()
        const { fillColor: color, radius } = this.options

        // Non-clustered points
        this.addLayer(
            {
                id,
                type: 'circle',
                source: id,
                filter: ['all', noCluster, isPoint],
                paint: {
                    'circle-color': color,
                    'circle-radius': radius,
                    'circle-stroke-width': outlineWidth,
                    'circle-stroke-color': outlineColor,
                },
            },
            true
        )

        // Non-clustered polygons
        this.addLayer(
            {
                id,
                type: 'fill',
                source: id,
                filter: ['all', noCluster, isPolygon],
                paint: {
                    'circle-color': colorExpr,
                    'fill-outline-color': outlineColor,
                },
            },
            true
        )

        // Clusters
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

        //
        this.addLayer({
            id: `${id}-count`,
            type: 'symbol',
            source: id,
            filter: isCluster,
            layout: {
                'text-field': '{count_formatted}',
                'text-font': textFont,
                'text-size': textSize,
            },
            paint: {
                'text-color': textColor,
            },
        })
    }

    onAdd() {
        const mapgl = this.getMapGL()
        this._source = mapgl.getSource(this.getId())
        this._tiles = mapgl.painter.style.sourceCaches[this.getId()]._tiles // TODO: Better way to access?
        this._tileSize = this._source.tileSize

        // mapgl.showTileBoundaries = true

        mapgl.on('zoomstart', this.onMoveStart)
        mapgl.on('dragstart', this.onMoveStart)
        mapgl.on('moveend', this.onMoveEnd)

        // Make sure tiles are available
        setTimeout(this.onMoveEnd, 1000)
    }

    onMoveStart = () => {
        this._clusters = []
    }

    onMoveEnd = () => {
        // console.log('onMoveEnd', this._tiles)
        for (const id in this._tiles) {
            this.loadTileClusters(this._tiles[id].tileID.canonical)
        }
    }

    onClick = evt => {
        const { type, feature, coordinates } = evt
        const { properties, geometry } = feature
        const { id, count, bounds } = properties

        if (count !== 1) {
            this.getMapGL().fitBounds(
                JSON.parse(bounds).map(latLng => latLng.reverse())
            )
        } else {
            this.options.onClick({
                type,
                coordinates,
                feature: {
                    id,
                    properties,
                    geometry,
                },
            })
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

        load(params, this.addTileClusters)
    }

    addTileClusters = (tileId, clusters) => {
        this._tileClusters[tileId] = clusters

        if (clusters.length && this._tiles[tileId]) {
            clusters.forEach(this.addClusterMarker)
        }
    }

    addClusterMarker = cluster => {
        const { properties } = cluster
        properties.count_formatted = formatCount(properties.count)
        this._clusters.push(cluster)
        this.updateClustersThrottled()
    }

    updateClusters() {
        this.setFeatures(this._clusters)
        this._source.setData(this.getFeatures())
    }

    isMaxZoom() {
        const mapgl = this.getMapGL()
        return mapgl.getZoom() === mapgl.getMaxZoom()
    }
}

export default ServerCluster
