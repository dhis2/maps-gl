import turfLength from '@turf/length'
import turfArea from '@turf/area'
import './Measure.css'

// https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/
// https://github.com/ljagis/leaflet-measure

const twoDecimals = value => Math.round(value * 100) / 100

// TODO: measurement dialog
class MeasureControl {
    constructor() {
        this._isActive = false
        this._type = 'measure'
    }

    onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
        this._setupUI()

        map.on('beforebaselayerchange', this._endMeasure)

        return this._container
    }

    onRemove() {
        this._clearMap()
        this._map.off('beforebaselayerchange', this._endMeasure)

        this._button.removeEventListener('click', this._onButtonClick)
        this._container.parentNode.removeChild(this._container)

        this._map = null
    }

    _setupUI() {
        const label = this._map._getUIString(
            'MeasureControl.MeasureDistanceAndArea'
        )

        this._button = document.createElement('button')
        this._button.type = 'button'
        this._button.className = 'mapboxgl-ctrl-icon dhis2-maps-ctrl-measure'
        this._button.setAttribute('title', label)
        this._button.setAttribute('aria-label', label)
        this._button.addEventListener('click', this._onButtonClick)

        this._container.appendChild(this._button)
    }

    _setupMapWhenReady() {
        const map = this._map

        if (map.isStyleLoaded()) {
            this._setupMap()
        } else {
            map.once('styledata', this._setupMap)
        }
    }

    _setupMap = () => {
        const map = this._map

        const color = '#ffa500'

        // GeoJSON object to hold our measurement features
        this._geojson = {
            type: 'FeatureCollection',
            features: [],
        }

        // Used to draw a line between points
        this._linestring = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [],
            },
        }

        // Used to draw a polygon between points
        this._polygon = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [],
            },
        }

        // Add source to map
        map.addSource('measure', {
            type: 'geojson',
            data: this._geojson,
        })

        // Add point styles
        map.addLayer({
            id: 'measure-points',
            type: 'circle',
            source: 'measure',
            paint: {
                'circle-radius': 5,
                'circle-color': color,
            },
            filter: ['in', '$type', 'Point'],
        })

        // Add line styles
        map.addLayer({
            id: 'measure-line',
            type: 'line',
            source: 'measure',
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-color': color,
                'line-width': 2.5,
            },
            filter: ['in', '$type', 'LineString'],
        })

        // Add polygon styles
        map.addLayer({
            id: 'measure-polygon',
            type: 'fill',
            source: 'measure',

            paint: {
                'fill-color': color,
                'fill-opacity': 0.1,
            },
            filter: ['in', '$type', 'Polygon'],
        })

        map.on('click', this._onMapClick)
        map.on('mousemove', this._onMouseMove)

        map.fire('measurestart')
    }

    _clearMap = () => {
        const map = this._map

        if (map.getLayer('measure-points')) {
            map.removeLayer('measure-points')
        }

        if (map.getLayer('measure-line')) {
            map.removeLayer('measure-line')
        }

        if (map.getLayer('measure-polygon')) {
            map.removeLayer('measure-polygon')
        }

        if (map.getSource('measure')) {
            map.removeSource('measure')
        }

        map.off('click', this._onMapClick)
        map.off('mousemove', this._onMouseMove)

        map.fire('measureend')

        map.getCanvas().style.cursor = 'pointer'

        this._geojson = null
        this._linestring = null
        this._polygon = null

        this._isActive = false
    }

    _startMeasure = () => {
        this._button.classList.add('active')

        if (!this._geojson) {
            this._setupMapWhenReady()
        }

        this._distanceContainer = document.createElement('div')
        this._distanceContainer.className = 'dhis2-maps-ctrl-measure-result'

        this._distanceText = document.createElement('div')
        this._distanceText.innerText = 'Klikk der du vil starte'
        this._distanceContainer.appendChild(this._distanceText)

        this._closeEl = document.createElement('span')
        this._closeEl.innerHTML = '&times;'
        this._closeEl.title = 'Avslutt måling'
        this._closeEl.addEventListener('click', this._endMeasure)
        this._distanceContainer.appendChild(this._closeEl)

        this._map.getContainer().appendChild(this._distanceContainer)
    }

    _endMeasure = () => {
        this._button.classList.remove('active')
        this._clearMap()

        if (this._distanceContainer) {
            this._closeEl.removeEventListener('click', this._endMeasure)
            this._map.getContainer().removeChild(this._distanceContainer)
            this._distanceContainer = null
        }
    }

    _onButtonClick = () => {
        this._isActive = !this._isActive
        this._isActive ? this._startMeasure() : this._endMeasure()
    }

    _onMapClick = evt => {
        const map = this._map
        const geojson = this._geojson
        let points = geojson.features.filter(f => f.geometry.type === 'Point')

        const clikedFeature = map.queryRenderedFeatures(evt.point, {
            layers: ['measure-points'],
        })[0]

        // If a feature was clicked, remove it from the map
        if (clikedFeature) {
            const { id } = clikedFeature.properties
            points = points.filter(p => p.properties.id !== id)
        } else {
            points = [
                ...points,
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [evt.lngLat.lng, evt.lngLat.lat],
                    },
                    properties: {
                        id: String(new Date().getTime()),
                    },
                },
            ]
        }

        geojson.features = [...points]

        if (points.length > 1) {
            this._linestring.geometry.coordinates = points.map(
                point => point.geometry.coordinates
            )

            geojson.features.push(this._linestring)

            const length = turfLength(this._linestring)
            const miles = length * 0.621371192

            this._distanceText.textContent = `Path distance: ${twoDecimals(
                length
            )} km (${twoDecimals(miles)} miles)`
        } else {
            this._distanceText.innerText = 'Klikk der du vil måle til'
        }

        if (points.length > 2) {
            this._polygon.geometry.coordinates = [
                [
                    ...points.map(point => point.geometry.coordinates),
                    points[0].geometry.coordinates,
                ],
            ]

            geojson.features.push(this._polygon)

            const area = turfArea(this._polygon)
            const hectares = area / 10000
            const acres = hectares * 2.47105381

            this._distanceText.textContent += ` Area: ${twoDecimals(
                hectares
            )} ha (${twoDecimals(acres)} acres)`
        }

        map.getSource('measure').setData(geojson)
    }

    _onMouseMove = evt => {
        const map = this._map

        const features = map.queryRenderedFeatures(evt.point, {
            layers: ['measure-points'],
        })

        // UI indicator for clicking/hovering a point on the map
        map.getCanvas().style.cursor = features.length ? 'pointer' : 'crosshair'
    }
}

export default MeasureControl
