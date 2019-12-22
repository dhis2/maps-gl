import Layer from './Layer'
import Spider from './Spider'
import { isPoint, isPolygon, noCluster } from '../utils/filters'
import { outlineColor, outlineWidth } from '../utils/style'

class Cluster extends Layer {
    constructor(options) {
        super(options)

        const { data, fillColor, radius } = options

        this.setFeatures(data)
        this.createSource()
        this.createLayers(fillColor, radius)
    }

    createSource(props) {
        this.setSource(this.getId(), {
            type: 'geojson',
            clusterMaxZoom: 12, // 14,
            clusterRadius: 50,
            ...props,
        })
    }

    createLayers(color, radius) {
        const id = this.getId()
        const colorExpr = ['case', ['has', 'color'], ['get', 'color'], color]

        // Non-clustered points
        this.addLayer(
            {
                id: `${id}-points`,
                type: 'circle',
                source: id,
                filter: ['all', noCluster, isPoint],
                paint: {
                    'circle-color': colorExpr,
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
                id: `${id}-polygons`,
                type: 'fill',
                source: id,
                filter: ['all', noCluster, isPolygon],
                paint: {
                    'fill-color': colorExpr,
                    'fill-outline-color': outlineColor,
                },
            },
            true
        )
    }

    setOpacity(opacity) {
        this.options.opacity = opacity

        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(`${id}-points`, 'circle-opacity', opacity)
            mapgl.setPaintProperty(`${id}-polygons`, 'fill-opacity', opacity)

            if (this.spiderId) {
                this.setSpiderClusterOpacity(this.spiderId, true)
                this.spider.setOpacity(opacity)
            }
        }
    }

    zoomToCluster = (clusterId, center) => {
        if (this.isMaxZoom()) {
            this.spiderfy(clusterId, center)
        } else {
            const mapgl = this.getMapGL()
            const source = mapgl.getSource(this.getId())

            source.getClusterExpansionZoom(clusterId, (error, zoom) => {
                if (error) return
                mapgl.easeTo({ center, zoom: zoom + 1 })
            })
        }
    }

    async spiderfy(clusterId, lnglat) {
        if (clusterId !== this.spiderId) {
            this.unspiderfy()

            const features = await this.getClusterFeatures(clusterId)

            this.spider.spiderfy(lnglat, features)

            this.spiderId = clusterId

            this.setSpiderClusterOpacity(clusterId, true)
        }
    }

    unspiderfy() {
        this.setSpiderClusterOpacity(this.spiderId)
        this.spider.unspiderfy()
        this.spiderId = null
    }

    setSpiderClusterOpacity() {}

    // Returns all features in a cluster
    getClusterFeatures = clusterId =>
        new Promise((resolve, reject) => {
            const mapgl = this.getMapGL()
            const source = mapgl.getSource(this.getId())

            source.getClusterLeaves(clusterId, null, null, (error, features) =>
                error ? reject(error) : resolve(features)
            )
        })

    onAdd() {
        const mapgl = this.getMapGL()
        const { radius, fillColor, opacity } = this.options

        mapgl.on('click', this.onMapClick)

        this.spider = new Spider(mapgl, {
            onClick: this.onClick,
            radius,
            fillColor,
            opacity,
        })

        this.setOpacity(this.options.opacity)
    }

    onRemove() {
        const mapgl = this.getMapGL()

        mapgl.off('click', this.onMapClick)

        this.spider = null
    }

    onMapClick = () => {
        this.unspiderfy()
    }
}

export default Cluster
