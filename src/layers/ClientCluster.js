
import Cluster from './Cluster'
import { featureCollection } from '../utils/geometry'
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
            data: featureCollection(this.getFeatures()),
        })
    }

    createLayers() {
        const id = this.getId()
        const { fillColor: color } = this.options

        super.createLayers()

        this.addLayer(
            {
                id: `${id}-cluster`,
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

    onAdd() {
        super.onAdd()

        if (this._hasPolygons) {
            const mapgl = this.getMapGL()

            mapgl.on('sourcedata', this.onSourceData)
            mapgl.on('moveend', this.updatePolygons)

            this.updatePolygons()
        }
    }

    onRemove() {
        super.onRemove()

        if (this._hasPolygons) {
            const mapgl = this.getMapGL()

            mapgl.off('sourcedata', this.onSourceData)
            mapgl.off('moveend', this.updatePolygons)
        }
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

    onSourceData = evt => {
        if (evt.sourceId === this.getId() && this.getSourceFeatures().length) {
            this.getMapGL().off('sourcedata', this.onSourceData)
            this.updatePolygons()
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
}

export default ClientCluster
