import EarthEngine, { defaultOptions } from '../EarthEngine'

const urlFormat =
    'https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/.../tiles/{z}/{x}/{y}'

const eeMock = {
    initialize(a, b, c) {
        c()
    },
    data: {
        setAuthToken: () => ({}),
        setAuthTokenRefresher: () => ({}),
    },
    Geometry: () => ({}),
    Image: () => ({
        select() {
            return this
        },
        projection() {
            return {
                nominalScale: () => {
                    return this
                },
            }
        },
        getInfo: cb => cb({}),
        clipToCollection() {
            return this
        },
        add() {
            return this
        },
        gt() {
            return this
        },
        visualize() {
            return this
        },
        getMap(a, b) {
            b({
                urlFormat,
            })
        },
    }),
    ImageCollection: () => ({
        filter() {
            return this
        },
        first: eeMock.Image,
        mosaic: eeMock.Image,
    }),
    FeatureCollection: features => features,
    Filter: {
        eq: () => ({}),
    },
    Reducer: () => ({}),
}

// Mock out EE API
jest.mock('../../utils/eeapi', () => ({
    __esModule: true,
    default: async () => eeMock,
}))

const accessToken = Promise.resolve({
    access_token: 'abc',
    client_id: '123',
    expires_in: 1000,
})

const onLoad = jest.fn()

const filter = [
    { id: '2020', name: '2020', type: 'eq', arguments: ['year', 2020] },
]

const data = [
    {
        type: 'Feature',
        properties: {
            id: 'O6uvpzGd5pu',
            name: 'Bo',
        },
        geometry: {
            type: 'Polygon',
            coordinates: [],
        },
    },
    {
        type: 'Feature',
        properties: {
            id: 'fdc6uOvgoji',
            name: 'Bombali',
        },
        geometry: {
            type: 'Polygon',
            coordinates: [],
        },
    },
]

const datasetId = 'WorldPop/GP/100m/pop_age_sex'

const params = {
    min: 0,
    max: 1500,
    palette: '#ffffd4,#fee391,#fec44f,#fe9929,#d95f0e,#993404',
}

const legend = [
    { color: '#ffffd4', from: 0, to: 300 },
    { color: '#fee391', from: 300, to: 600 },
    { color: '#fec44f', from: 600, to: 900 },
    { color: '#fe9929', from: 900, to: 1200 },
    { color: '#d95f0e', from: 1200, to: 1500 },
    { color: '#993404', from: 1500 },
]

const options = {
    accessToken,
    datasetId,
    filter,
    data,
    params,
    legend,
    onLoad,
}

describe('EarthEngine', () => {
    it('Should initialize', () => {
        const layer = new EarthEngine()

        expect(layer.getId()).not.toBeNull()
        expect(layer.options).toEqual(defaultOptions)
    })

    it('Should add to map and init EE', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)

        expect(layer.getMap()).toBe(mockMap)
        expect(layer.getMapGL()).toBe(mockMapGL)
        expect(layer.ee).toBe(eeMock)
    })

    it('Should create a raster and source', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)
        const id = layer.getId()
        const source = layer.getSource()[id]

        expect(source).not.toBeUndefined()
        expect(source.type).toBe('raster')
        expect(source.tiles[0]).toBe(urlFormat)
    })

    it('Should create a geojson source', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)
        const id = layer.getId()
        const source = layer.getSource()[`${id}-features`]

        expect(source).not.toBeUndefined()
        expect(source.type).toBe('geojson')
    })

    it('Should create a raster and geojson layers', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)
        const id = layer.getId()
        const layers = layer.getLayers()
        const [layer1, layer2, layer3] = layers

        expect(layers.length).toBe(3)
        expect(layer1.type).toBe('raster')
        expect(layer1.id).toBe(`${id}-raster`)
        expect(layer1.source).toBe(id)
        expect(layer2.type).toBe('fill')
        expect(layer2.id).toBe(`${id}-polygon`)
        expect(layer2.source).toBe(`${id}-features`)
        expect(layer3.type).toBe('line')
        expect(layer3.id).toBe(`${id}-outline`)
        expect(layer3.source).toBe(`${id}-features`)
    })

    it('Should call onLoad option when loaded', async () => {
        const layer = new EarthEngine(options)
        const numCalls = onLoad.mock.calls.length
        await layer.addTo(mockMap)

        expect(onLoad.mock.calls.length).toBe(numCalls + 1)
    })

    it('Should use string ids for ee features', async () => {
        const layer = new EarthEngine(options)
        const before = layer.getFeatures()
        await layer.addTo(mockMap)
        const after = layer.getFeatureCollection()

        expect(before.every(f => typeof f.id === 'number')).toBe(true)
        expect(after.every(f => typeof f.id === 'string')).toBe(true)
        expect(after.every(f => f.id === f.properties.id)).toBe(true)
    })
})
