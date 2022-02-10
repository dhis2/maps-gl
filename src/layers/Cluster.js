import centerOfMass from '@turf/center-of-mass'
import Layer from './Layer'
import Spider from './Spider'
import { pointLayer, polygonLayer, outlineLayer } from '../utils/layers'
import { isClusterPoint } from '../utils/filters'
import { featureCollection } from '../utils/geometry'
import { eventStrokeColor } from '../utils/style'

class Cluster extends Layer {
    constructor(options) {
        super(options)

        this.createSource()
        this.createLayers()
    }

    setFeatures(data = []) {
        super.setFeatures(data) // Assigns id to each feature

        this._hasPolygons = data.some(f => f.geometry.type === 'Polygon')

        if (this._hasPolygons) {
            this._polygons = {}
            this._polygonsOnMap = []

            // Translate from polygon to point before clustering
            this._features = this._features.map(f => {
                if (f.geometry.type === 'Polygon') {
                    this._polygons[f.id] = f

                    return {
                        ...f,
                        geometry: centerOfMass(f).geometry,
                        properties: {
                            ...f.properties,
                            isPolygon: true,
                        },
                    }
                }

                return f
            })
        }
    }

    createSource(props) {
        const id = this.getId()

        this.setSource(id, {
            type: 'geojson',
            clusterMaxZoom: 14,
            clusterRadius: 50,
            ...props,
        })

        this.setSource(`${id}-polygons`, {
            type: 'geojson',
            data: featureCollection(),
        })
    }

    createLayers() {
        const id = this.getId()
        const {
            fillColor: color,
            strokeColor = eventStrokeColor,
            radius,
        } = this.options
        const isInteractive = true

        // Non-clustered points
        this.addLayer(
            pointLayer({
                id,
                color,
                strokeColor,
                radius,
                filter: isClusterPoint,
            }),
            { isInteractive }
        )

        // Non-clustered polygons
        this.addLayer(polygonLayer({ id, color, source: `${id}-polygons` }), {
            isInteractive,
        })
        this.addLayer(
            outlineLayer({
                id,
                color: strokeColor,
                source: `${id}-polygons`,
            })
        )
    }

    setOpacity(opacity) {
        super.setOpacity(opacity)

        if (this.spider) {
            this.setClusterOpacity(this.spider.getId(), true)
            this.spider.setOpacity(opacity)
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
        if (this.spider && !this.spider.isExpanded(clusterId)) {
            this.spider.unspiderfy()

            const features = await this.getClusterFeatures(clusterId)

            this.spider.spiderfy(clusterId, lnglat, features)

            this.setClusterOpacity(clusterId, true)

            this.getMapGL().on('zoom', this.unspiderfy)
        }
    }

    unspiderfy = () => {
        const mapgl = this.getMapGL()

        if (this.spider && mapgl) {
            this.spider.unspiderfy()
            mapgl.off('zoom', this.unspiderfy)
        }
    }

    setClusterOpacity(clusterId, isExpanded) {
        if (clusterId) {
            const { opacity } = this.options

            this.getMapGL().setPaintProperty(
                `${this.getId()}-cluster`,
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

    // Returns all features in a cluster
    getClusterFeatures = clusterId =>
        new Promise((resolve, reject) => {
            const mapgl = this.getMapGL()
            const source = mapgl.getSource(this.getId())

            source.getClusterLeaves(clusterId, null, null, (error, features) =>
                error
                    ? reject(error)
                    : resolve(this.sortClusterFeatures(features))
            )
        })

    // Overrided in DonutCluster
    sortClusterFeatures = features => features

    updatePolygons = () => {
        // Returns polygons visible on the map (within the map view and not clustered)
        const polygons = this.getSourceFeatures().filter(
            f => f.properties.isPolygon
        )
        let polygonIds = []

        if (polygons.length) {
            // Using set as features might be returned multipe times due to tiling
            polygonIds = [...new Set(polygons.map(f => f.id))].sort()
        }

        // Only update source if there is a change
        if (
            polygonIds.length !== this._polygonsOnMap.length ||
            polygonIds.some((id, index) => id !== this._polygonsOnMap[index])
        ) {
            this._polygonsOnMap = polygonIds

            const features = polygonIds.map(id => this._polygons[id])
            const source = this.getMapGL().getSource(`${this.getId()}-polygons`)

            source.setData(featureCollection(features))
        }
    }

    // Returns source features
    getSourceFeatures() {
        return this.getMapGL().querySourceFeatures(this.getId())
    }

    onSpiderClose = clusterId => {
        this.setClusterOpacity(clusterId)
    }

    onAdd() {
        const mapgl = this.getMapGL()
        const { radius, fillColor, opacity } = this.options

        this.spider = new Spider(mapgl, {
            onClick: this.onClick,
            radius,
            fillColor,
            opacity,
            onClose: this.onSpiderClose,
        })

        this.setOpacity(this.options.opacity)
    }

    onRemove() {
        this.unspiderfy()
        this.spider = null
    }
}

export default Cluster
