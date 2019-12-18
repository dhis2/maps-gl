import MapboxglSpiderifier from 'mapboxgl-spiderifier'
import 'mapboxgl-spiderifier/index.css'
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

class ClientCluster extends Cluster {
    createSource() {
        super.createSource({
            cluster: true,
            data: this.getFeatures(),
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

    isDonutClusters() {
        return Array.isArray(this.options.groups)
    }

    onAdd() {
        const mapgl = this.getMapGL()

        this._spiderifier = new MapboxglSpiderifier(mapgl, {
            animate: true,
            animationSpeed: 200,
            customPin: true,
            onClick: this.onSpiderClick,
            initializeLeg: this.initializeSpiderLeg,
        })

        mapgl.on('click', this.onMapClick)
    }

    onRemove() {
        const mapgl = this.getMapGL()

        mapgl.off('click', this.onMapClick)

        this._spiderifier = null
    }

    onClick = evt => {
        const { feature } = evt

        if (!feature.properties.cluster) {
            // Hack until Mapbox GL JS support string ids
            // https://github.com/mapbox/mapbox-gl-js/issues/2716
            if (
                typeof feature.id === 'number' &&
                typeof feature.properties.id === 'string'
            ) {
                const { type, properties, geometry } = feature
                const { id } = properties
                evt.feature = { type, id, properties, geometry }
            }

            this.fire('click', evt)
        } else {
            this.zoomToCluster(
                feature.properties.cluster_id,
                feature.geometry.coordinates
            )
        }
    }

    onSpiderClick = (evt, spiderLeg) => {
        evt.stopPropagation()

        const { feature, mapboxMarker } = spiderLeg
        const { lng, lat } = mapboxMarker.getLngLat()

        this.onClick({
            type: 'click',
            coordinates: [lng, lat],
            position: [evt.x, evt.pageY || evt.y],
            offset: MapboxglSpiderifier.popupOffsetForSpiderLeg(spiderLeg),
            feature: feature,
        })
    }

    onMapClick = () => {
        if (this.isDonutClusters()) {
            this.unspiderify()
        }
    }

    setOpacity(opacity) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(`${id}-points`, 'circle-opacity', opacity)
            mapgl.setPaintProperty(`${id}-polygons`, 'fill-opacity', opacity)
            mapgl.setPaintProperty(`${id}-clusters`, 'circle-opacity', opacity)
            mapgl.setPaintProperty(
                `${id}-clusters`,
                'circle-stroke-opacity',
                opacity
            )
            mapgl.setPaintProperty(`${id}-count`, 'text-opacity', opacity)

            if (this._spider) {
                this._spiderifier.each(
                    spiderLeg =>
                        (spiderLeg.elements.container.style.opacity = opacity)
                )
            }
        }

        this.options.opacity = opacity
    }

    zoomToCluster = (clusterId, center) => {
        if (this.isMaxZoom()) {
            this.spiderify(clusterId, center)
        } else {
            const mapgl = this.getMapGL()
            const source = mapgl.getSource(this.getId())

            source.getClusterExpansionZoom(clusterId, (error, zoom) => {
                if (error) return
                mapgl.easeTo({ center, zoom: zoom + 1 })
            })
        }
    }

    // Returns all features in a cluster
    getClusterFeatures = clusterId =>
        new Promise((resolve, reject) => {
            const mapgl = this.getMapGL()
            const source = mapgl.getSource(this.getId())

            source.getClusterLeaves(clusterId, null, null, (error, features) =>
                error ? reject(error) : resolve(features)
            )
        })

    spiderify = async (clusterId, lnglat) => {
        if (clusterId !== this._spider) {
            this.unspiderify()

            const features = await this.getClusterFeatures(clusterId)

            this._spiderifier.spiderfy(lnglat, features)

            this._spider = clusterId

            if (this.isDonutClusters()) {
                this.setDonutOpacity(clusterId, 0.1)
            }
        }
    }

    unspiderify = () => {
        const clusterId = this._spider

        this._spiderifier.unspiderfy()

        this._spider = null
    }

    initializeSpiderLeg = spiderLeg => {
        const { feature, elements } = spiderLeg
        const { radius, fillColor, opacity } = this.options
        const color = feature.properties.color || fillColor
        const marker = document.createElement('div')

        marker.setAttribute(
            'style',
            `
            width: ${radius * 2}px;
            height: ${radius * 2}px;
            margin-left: -${radius}px;
            margin-top: -${radius}px;
            background-color: ${color};
            opacity: ${opacity};
            border-radius: 50%;`
        )

        elements.pin.appendChild(marker)
    }
}

export default ClientCluster
