import turfLength from '@turf/length'
import turfArea from '@turf/area'
import bbox from '@turf/bbox'
import './Measure.css'

// Inspired by https://github.com/ljagis/leaflet-measure

const twoDecimals = value => (Math.round(value * 100) / 100).toLocaleString()

const createElement = (element, className, text) => {
    const el = document.createElement(element)

    if (className) {
        el.className = className
    }

    if (text) {
        el.innerText = text
    }

    return el
}

class MeasureControl {
    constructor() {
        this._isActive = false
        this._type = 'measure'
    }

    onAdd(map) {
        this._map = map
        this._container = createElement(
            'div',
            'mapboxgl-ctrl mapboxgl-ctrl-group'
        )
        this._setupUI()

        return this._container
    }

    onRemove() {
        this._clearMap()
        this._button.removeEventListener('click', this._onButtonClick)
        this._container.parentNode.removeChild(this._container)

        this._map = null
    }

    _setupUI() {
        const label = this._map._getUIString(
            'MeasureControl.MeasureDistancesAndAreas'
        )

        this._button = createElement(
            'button',
            'mapboxgl-ctrl-icon dhis2-maps-ctrl-measure'
        )
        this._button.type = 'button'
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
        const map = this._map

        this._button.classList.add('active')

        if (!this._geojson) {
            this._setupMapWhenReady()
        }

        this._distanceContainer = document.createElement('div')
        this._distanceContainer.className = 'dhis2-maps-ctrl-measure-result'

        const headerEl = document.createElement('div')
        headerEl.className = 'dhis2-maps-ctrl-measure-header'
        headerEl.innerText = map._getUIString(
            'MeasureControl.MeasureDistancesAndAreas'
        )
        this._distanceContainer.appendChild(headerEl)

        this._distanceText = document.createElement('p')
        this._distanceText.innerText = map._getUIString(
            'MeasureControl.ClickStartMeasurement'
        )
        this._distanceContainer.appendChild(this._distanceText)

        this._actionsEl = document.createElement('div')
        this._actionsEl.className = 'dhis2-maps-ctrl-measure-actions'
        this._distanceContainer.appendChild(this._actionsEl)

        this._cancelEl = document.createElement('span')
        this._cancelEl.className = 'dhis2-maps-ctrl-measure-cancel'
        this._cancelEl.innerText = map._getUIString('MeasureControl.Cancel')
        this._cancelEl.addEventListener('click', this._endMeasure)
        this._actionsEl.appendChild(this._cancelEl)

        this._finishEl = document.createElement('span')
        this._finishEl.className = 'dhis2-maps-ctrl-measure-finish'
        this._finishEl.innerText = map._getUIString(
            'MeasureControl.FinishMeasurement'
        )
        this._finishEl.addEventListener('click', this._finishMeasure)
        this._actionsEl.appendChild(this._finishEl)

        this._map.getContainer().appendChild(this._distanceContainer)
    }

    _finishMeasure = () => {
        const map = this._map
        const geojson = this._geojson
        const points = geojson.features.filter(f => f.geometry.type === 'Point')

        if (points.length < 2) {
            return this._endMeasure()
        } else if (points.length > 2) {
            const lineIndex = geojson.features.findIndex(
                f => f === this._linestring
            )

            this._linestring.geometry.coordinates = [
                ...points.map(point => point.geometry.coordinates),
                points[0].geometry.coordinates,
            ]

            geojson.features[lineIndex] = this._linestring

            map.getSource('measure').setData(geojson)

            const length = turfLength(this._linestring)
            const miles = length * 0.621371192

            const perimeterText = `${map._getUIString(
                'MeasureControl.Perimeter'
            )}: ${twoDecimals(length)} ${map._getUIString(
                'MeasureControl.Kilometers'
            )} (${twoDecimals(miles)} ${map._getUIString(
                'MeasureControl.Miles'
            )})`

            this._distanceEl.textContent = perimeterText
        }

        this._actionsEl.innerText = ''

        this._centerEl = document.createElement('span')
        this._centerEl.className = 'dhis2-maps-ctrl-measure-center'
        this._centerEl.innerText = map._getUIString(
            `MeasureControl.CenterMapOn${points.length === 2 ? 'Line' : 'Area'}`
        )
        this._centerEl.addEventListener('click', this._centerMap)
        this._actionsEl.appendChild(this._centerEl)

        this._deleteEl = document.createElement('span')
        this._deleteEl.className = 'dhis2-maps-ctrl-measure-delete'
        this._deleteEl.innerText = map._getUIString('MeasureControl.Delete')
        this._deleteEl.addEventListener('click', this._endMeasure)
        this._actionsEl.appendChild(this._deleteEl)
    }

    _endMeasure = () => {
        this._button.classList.remove('active')
        this._clearMap()

        if (this._distanceContainer) {
            this._finishEl.removeEventListener('click', this._endMeasure)
            this._map.getContainer().removeChild(this._distanceContainer)
            this._distanceContainer = null
        }
    }

    _centerMap = () => {
        const [x1, y1, x2, y2] = bbox(this._geojson)

        this._map.fitBounds([[x1, y1], [x2, y2]], {
            padding: 100,
        })
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

        if (points.length === 1) {
            this._distanceText.innerText = map._getUIString(
                'MeasureControl.ClickNextPosition'
            )
        } else {
            this._linestring.geometry.coordinates = points.map(
                point => point.geometry.coordinates
            )

            geojson.features.push(this._linestring)

            const length = turfLength(this._linestring)
            const miles = length * 0.621371192

            const distanceText = `${map._getUIString(
                'MeasureControl.Distance'
            )}: ${twoDecimals(length)} ${map._getUIString(
                'MeasureControl.Kilometers'
            )} (${twoDecimals(miles)} ${map._getUIString(
                'MeasureControl.Miles'
            )})`

            this._distanceEl = document.createElement('div')
            this._distanceEl.className = 'dhis2-maps-ctrl-measure-distance'

            this._distanceEl.textContent = distanceText

            this._distanceText.innerText = ''
            this._distanceText.appendChild(this._distanceEl)
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

            const areaText = `Area: ${twoDecimals(hectares)} ha (${twoDecimals(
                acres
            )} acres)`

            const areaEl = document.createElement('div')
            areaEl.className = 'dhis2-maps-ctrl-measure-area'
            areaEl.textContent = areaText

            this._distanceText.appendChild(areaEl)
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
