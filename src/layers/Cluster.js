import MapboxglSpiderifier from 'mapboxgl-spiderifier'
import 'mapboxgl-spiderifier/index.css'
import Layer from './Layer'
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
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(`${id}-points`, 'circle-opacity', opacity)
            mapgl.setPaintProperty(`${id}-polygons`, 'fill-opacity', opacity)

            if (this.spiderId) {
                this.spiderifier.each(
                    spiderLeg =>
                        (spiderLeg.elements.container.style.opacity = opacity)
                )
            }
        }
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

    async spiderfy(clusterId, lnglat) {
        if (clusterId !== this.spiderId) {
            this.unspiderfy()

            const features = await this.getClusterFeatures(clusterId)

            this.spiderifier.spiderfy(lnglat, features)

            this.spiderId = clusterId
        }
    }

    unspiderfy() {
        this.spiderifier.unspiderfy()
        this.spiderId = null
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

    onAdd() {
        const mapgl = this.getMapGL()

        mapgl.on('click', this.onMapClick)

        this.spiderifier = new MapboxglSpiderifier(mapgl, {
            animate: true,
            animationSpeed: 200,
            customPin: true,
            onClick: this.onSpiderClick,
            initializeLeg: this.initializeSpiderLeg,
        })
    }

    onRemove() {
        const mapgl = this.getMapGL()

        mapgl.off('click', this.onMapClick)

        this.spiderifier = null
    }

    onMapClick = () => {
        this.unspiderfy()
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
}

export default Cluster
