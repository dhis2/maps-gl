import mapboxgl from 'mapbox-gl'
import Layer from './Layer'

class ClientCluster extends Layer {
    constructor(options) {
        super(options)

        const { data, fillColor, radius } = options

        // Caching clusters for performance
        this.clusters = {}
        this.clustersOnScreen = {}

        this.setFeatures(data)
        this.createSource()
        this.createLayers(fillColor, radius)
    }

    createSource() {
        const id = this.getId()
        const data = this.getFeatures()
        const colors = [...new Set(data.features.map(f => f.properties.color))] // Unique colors
        const clusterProperties = colors.reduce((obj, color) => {
            obj[color] = ['+', ['case', ['==', ['get', 'color'], color], 1, 0]]
            return obj
        }, {})

        console.log('unique colors', colors, clusterProperties)

        this.setSource(id, {
            type: 'geojson',
            data,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
            clusterProperties,
        })
    }

    createLayers(color, radius) {
        const id = this.getId()

        /*
        this.addLayer({
            id: `${id}-clusters`,
            type: 'circle',
            source: id,
            filter: ["==", "cluster", true],
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

        this.addLayer({
            id: `${id}-count`,
            type: 'symbol',
            source: id,
            filter: ["==", "cluster", true],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold'],
                'text-size': 16,
            },
            paint: {
                'text-color': '#fff',
            },
        })
        */

        this.addLayer({
            id,
            type: 'circle',
            source: id,
            filter: ['!=', 'cluster', true],
            paint: {
                'circle-color': [
                    'case',
                    ['has', 'color'],
                    ['get', 'color'],
                    color,
                ],
                'circle-radius': radius,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff',
            },
        })
    }

    updateClusters() {
        const mapgl = this.getMapGL()
        const newClusters = {}
        const features = mapgl.querySourceFeatures(this.getId())

        console.log('updateClusters', features)

        // For every cluster on the screen, create an HTML marker for it (if we didn't yet),
        // and add it to the map if it's not there already
        for (let i = 0; i < features.length; i++) {
            const { geometry, properties } = features[i]
            const { coordinates } = geometry
            const { cluster: isCluster, cluster_id } = properties

            if (!isCluster) {
                continue
            }

            let cluster = this.clusters[cluster_id]

            if (!cluster) {
                const el = this.createDonutChart(properties)
                cluster = new mapboxgl.Marker({ element: el }).setLngLat(
                    coordinates
                )
                this.clusters[cluster_id] = cluster
            }

            newClusters[cluster_id] = cluster

            if (!this.clustersOnScreen[cluster_id]) {
                cluster.addTo(this.getMapGL())
            }
        }

        // For every cluster we've added previously, remove those that are no longer visible
        for (const id in this.clustersOnScreen) {
            if (!newClusters[id]) {
                this.clustersOnScreen[id].remove()
            }
        }
        this.clustersOnScreen = newClusters
    }

    createDonutChart(props) {
        const colors = Object.keys(props).filter(p => p.startsWith('#'))
        const counts = colors.map(color => props[color])
        const offsets = []
        let total = 0

        for (var i = 0; i < counts.length; i++) {
            offsets.push(total)
            total += counts[i]
        }

        console.log('createDonutChart', total, offsets, counts, colors, props)

        var fontSize =
            total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16
        var r = total >= 1000 ? 50 : total >= 100 ? 32 : total >= 10 ? 24 : 18
        var r0 = Math.round(r * 0.6)
        var w = r * 2

        let html = `<svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif">`

        for (i = 0; i < counts.length; i++) {
            html += this.donutSegment(
                offsets[i] / total,
                (offsets[i] + counts[i]) / total,
                r,
                r0,
                colors[i]
            )
        }

        html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />`
        html += `<text dominant-baseline="central" transform="translate(${r}, ${r})">${
            props.point_count
        }</text></svg>`

        const el = document.createElement('div')
        el.innerHTML = html

        return el.firstChild
    }

    donutSegment(start, end, r, r0, color) {
        if (end - start === 1) end -= 0.00001
        const a0 = 2 * Math.PI * (start - 0.25)
        const a1 = 2 * Math.PI * (end - 0.25)
        const x0 = Math.cos(a0),
            y0 = Math.sin(a0)
        const x1 = Math.cos(a1),
            y1 = Math.sin(a1)
        const largeArc = end - start > 0.5 ? 1 : 0

        return [
            '<path d="M',
            r + r0 * x0,
            r + r0 * y0,
            'L',
            r + r * x0,
            r + r * y0,
            'A',
            r,
            r,
            0,
            largeArc,
            1,
            r + r * x1,
            r + r * y1,
            'L',
            r + r0 * x1,
            r + r0 * y1,
            'A',
            r0,
            r0,
            0,
            largeArc,
            0,
            r + r0 * x0,
            r + r0 * y0,
            '" fill="' + color + '" />',
        ].join(' ')
    }

    onAdd() {
        this.getMapGL().on('data', this.onData)
    }

    // TODO: call from parent
    onRemove() {
        this.getMapGL().off('data', this.onData)
    }

    onData = evt => {
        if (evt.sourceId !== this.getId() || !evt.isSourceLoaded) {
            return
        }

        this.updateClusters()
        // console.log('onData', evt.sourceId, this.getId());
    }

    setOpacity(opacity) {
        if (this.isOnMap()) {
            const mapgl = this.getMapGL()
            const id = this.getId()

            mapgl.setPaintProperty(id, 'circle-opacity', opacity)
            mapgl.setPaintProperty(id, 'circle-stroke-opacity', opacity)
            mapgl.setPaintProperty(`${id}-clusters`, 'circle-opacity', opacity)
            mapgl.setPaintProperty(
                `${id}-clusters`,
                'circle-stroke-opacity',
                opacity
            )
            mapgl.setPaintProperty(`${id}-count`, 'text-opacity', opacity)
        }
    }
}

export default ClientCluster
