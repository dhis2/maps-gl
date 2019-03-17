mapboxgl.accessToken =
    'pk.eyJ1IjoibWFzdGVybWFwcyIsImEiOiJjaXdiYnZlaDgwMDNuMnZucm40dG1jZjd2In0.2oOUnZaKYWuZyz35I4rD9g'

const analyticsApi = 'http://localhost:8080/api/2.30/api/30/analytics/'
const malariaEvents =
    'events/query/VBqh0ynB2wv.json?dimension=ou:ImspTQPwCqd&stage=pTo4uMt3xur&coordinatesOnly=true&startDate=2017-10-01&endDate=2018-10-01'
const serverTiles = 'http://localhost:5001/'

const username = 'admin'
const password = 'district'

const truncationCount = 20000

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
})

map.fitBounds([[-13.1899707, 7.009718], [-10.4107857, 9.860312]])

const addServerVectorLayers = () => {
    map.addSource('orgUnits', {
        type: 'vector',
        tiles: [`${serverTiles}sierraleone-orgunits/{z}/{x}/{y}`],
    })
    map.addSource('serverMalaria', {
        type: 'vector',
        tiles: [`${serverTiles}malaria/{z}/{x}/{y}`],
    })
    map.addLayer({
        id: 'sierraleone-facilities',
        type: 'circle',
        source: 'orgUnits',
        'source-layer': 'facility',
        minzoom: 7, // Zoom levels not visible on init fail for some reason...
        // "layout": {
        //     "line-join": "round",
        //     "line-cap": "round"
        // },
        paint: {
            'circle-color': '#0000FF',
            'circle-radius': 5,
            'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                0,
                9,
                0,
                10,
                1,
            ],
        },
    })
    map.addLayer({
        id: 'sierraleone-chiefdoms',
        type: 'line',
        source: 'orgUnits',
        'source-layer': 'chiefdom',
        // "layout": {
        //     "line-join": "round",
        //     "line-cap": "round"
        // },
        minzoom: 7, // Zoom levels not visible on init fail for some reason...
        paint: {
            'line-color': '#999999',
            'line-width': 2,
            'line-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 1],
        },
    })
    map.addLayer({
        id: 'sierraleone-districts',
        type: 'line',
        source: 'orgUnits',
        'source-layer': 'district',
        // "layout": {
        //     "line-join": "round",
        //     "line-cap": "round"
        // },
        paint: {
            'line-color': '#333333',
            'line-width': 2,
        },
    })

    map.addLayer({
        id: 'sierraleone-malaria-pts',
        type: 'circle',
        source: 'serverMalaria',
        'source-layer': 'malariaevents',
        minzoom: 7, // Zoom levels not visible on init fail for some reason...
        // "layout": {
        //     "line-join": "round",
        //     "line-cap": "round"
        // },
        paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 2, 16, 4],
            'circle-color': '#FF0000',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
            'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                0,
                14,
                1,
            ],
            'circle-stroke-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                0,
                14,
                1,
            ],
        },
    })
    map.addLayer({
        id: 'sierraleone-malaria-heatmap',
        type: 'heatmap',
        source: 'serverMalaria',
        'source-layer': 'malariaevents',
        maxzoom: 14,
        // "layout": {
        //     "line-join": "round",
        //     "line-cap": "round"
        // },
        paint: {
            'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                9,
                0.8,
                11,
                0.2,
                14,
                0,
            ],
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'mag'],
                0,
                0,
                6,
                1,
            ],
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                1,
                11,
                3,
            ],
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(33,102,172,0)',
                0.2,
                'rgb(103,169,207)',
                0.4,
                'rgb(209,229,240)',
                0.6,
                'rgb(253,219,199)',
                0.8,
                'rgb(239,138,98)',
                1,
                'rgb(178,24,43)',
            ],
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                2,
                11,
                20,
            ],
        },
    })
}

const getData = async request =>
    // await fetch(`${analyticsApi}${request}`, {
    await fetch('data/malaria-events.json', {
        header: {
            'Content-Type': 'application/json',
            // 'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        },
    })
        .then(response => response.json())
        .then(json => ({
            type: 'FeatureCollection',
            features: json.rows.map(row => ({
                type: 'Feature',
                id: row[0],
                properties: json.headers.reduce(
                    (o, h, i) => ({
                        ...o,
                        h: row[i],
                    }),
                    {}
                ),
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(row[3]), parseFloat(row[4])],
                },
            })),
        }))
const eventDataPromise = getData()

const createClusters = async () => {
    const data = await eventDataPromise

    map.addSource('events-clustered', {
        type: 'geojson',
        data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
    })

    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'events-clustered',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': '#51bbd6',
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                15,
                100,
                20,
                750,
                30,
            ],
        },
    })

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'events-clustered',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
        },
    })

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'events-clustered',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#11b4da',
            'circle-radius': 4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
        },
    })
}

const createHeatmap = async () => {
    const data = await eventDataPromise
    const truncatedData = {
        ...data,
        features: data.features.slice(0, truncationCount),
    }
    map.addSource('events-truncated', {
        type: 'geojson',
        data: truncatedData,
    })
    map.addLayer(
        {
            id: 'heatmap',
            type: 'heatmap',
            source: 'events-truncated',
            maxzoom: 12,
            paint: {
                // Increase the heatmap weight based on frequency and property magnitude
                'heatmap-weight': 0.5,
                /*
            "heatmap-weight": [
                "interpolate",
                ["linear"],
                ["get", "mag"],
                0, 0,
                6, 1
            ],
            */
                // Increase the heatmap color weight weight by zoom level
                // heatmap-intensity is a multiplier on top of heatmap-weight
                'heatmap-intensity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0,
                    1,
                    9,
                    3,
                ],
                // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
                // Begin color ramp at 0-stop with a 0-transparancy color
                // to create a blur-like effect.
                'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0,
                    'rgba(33,102,172,0)',
                    0.2,
                    'rgb(103,169,207)',
                    0.4,
                    'rgb(209,229,240)',
                    0.6,
                    'rgb(253,219,199)',
                    0.8,
                    'rgb(239,138,98)',
                    1,
                    'rgb(178,24,43)',
                ],
                // Adjust the heatmap radius by zoom level
                'heatmap-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0,
                    1,
                    12,
                    10,
                ],
                // Transition from heatmap to circle layer by zoom level
                'heatmap-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    7,
                    1,
                    9,
                    1,
                ],
            },
        },
        'waterway-label'
    )

    map.addLayer(
        {
            id: 'heatmap-points',
            type: 'circle',
            source: 'events-truncated',
            minzoom: 9,
            paint: {
                // Size circle radius by earthquake magnitude and zoom level
                'circle-radius': 4,
                // Color circle by earthquake magnitude
                'circle-color': 'rgb(178,24,43)',
                'circle-stroke-color': 'white',
                'circle-stroke-width': 1,
                // Transition from heatmap to circle layer by zoom level
                'circle-opacity': 1,
            },
        },
        'waterway-label'
    )
}

const createPoints = async () => {
    map.addSource('events', {
        type: 'geojson',
        data: await eventDataPromise,
    })
    map.addLayer(
        {
            id: 'events-points',
            type: 'circle',
            source: 'events',
            // "minzoom": 10,
            paint: {
                // Size circle radius by earthquake magnitude and zoom level
                'circle-radius': 4,
                // Color circle by earthquake magnitude
                'circle-color': 'red',
                'circle-stroke-color': 'white',
                'circle-stroke-width': 1,
                // Transition from heatmap to circle layer by zoom level
                'circle-opacity': 1,
            },
        },
        'waterway-label'
    )
}

const layerGroups = [
    {
        name: 'Org Units',
        layers: [
            'sierraleone-districts',
            'sierraleone-chiefdoms',
            'sierraleone-facilities',
        ],
        visible: true,
        independent: true,
    },
    [
        {
            name: 'Server Heatmap',
            layers: ['sierraleone-malaria-heatmap', 'sierraleone-malaria-pts'],
            visible: true,
        },
        {
            name: 'Client Clusters',
            layers: ['clusters', 'cluster-count', 'unclustered-point'],
            visible: false,
        },
        {
            name: 'Client Heatmap (20k)',
            layers: ['heatmap', 'heatmap-points'],
            visible: false,
        },
        {
            name: 'Client Points',
            layers: ['events-points'],
            visible: false,
        },
    ],
]

const allLayerGroups = []
layerGroups.forEach(group => {
    if (Array.isArray(group)) {
        group.forEach(subGroup => {
            subGroup.metaGroup = group
            allLayerGroups.push(subGroup)
        })
    } else {
        allLayerGroups.push(group)
    }
})

updateLayerVisibilities = () => {
    allLayerGroups.forEach(group => {
        group.layers.forEach(layer => {
            if (!group.visible) {
                map.setLayoutProperty(layer, 'visibility', 'none')
            } else {
                map.setLayoutProperty(layer, 'visibility', 'visible')
            }
        })
    })
}

const appendLayerToggle = (group, parentDom) => {
    var link = document.createElement('a')
    link.href = '#'
    link.className = group.visible ? 'active' : ''
    link.textContent = group.name

    group.link = link

    link.onclick = ((group, e) => {
        e.preventDefault()
        e.stopPropagation()

        if (group.metaGroup) {
            if (!group.visible) {
                group.metaGroup.forEach(g => {
                    g.visible = false
                    g.link.className = ''
                })
                group.visible = true
            }
        } else {
            group.visible = !group.visible
        }

        group.link.className = group.visible ? 'active' : ''
        updateLayerVisibilities()
    }).bind(null, group)

    parentDom.appendChild(link)
}

function createLayerToggles() {
    var layerListDom = document.getElementById('menu')
    layerGroups.forEach(group => {
        if (Array.isArray(group)) {
            const toggleGroupDom = document.createElement('div')
            toggleGroupDom.className = 'toggleGroup'
            group.forEach(subGroup => {
                appendLayerToggle(subGroup, toggleGroupDom)
            })
            layerListDom.appendChild(toggleGroupDom)
        } else {
            appendLayerToggle(group, layerListDom)
        }
    })
}

const init = async () => {
    addServerVectorLayers()
    await createClusters()
    await createHeatmap()
    await createPoints()

    updateLayerVisibilities()
}

map.on('load', init)
createLayerToggles()
