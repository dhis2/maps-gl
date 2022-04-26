import EarthEngine from '../EarthEngine'

const urlFormat =
    'https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/.../tiles/{z}/{x}/{y}'

// Mock out EE Worker - import.meta not supported in jest
jest.mock('../../earthengine/ee_worker_loader', () => ({
    __esModule: true,
    default: async () => async () =>
        new (class EarthEngineWorkerMock {
            getTileUrl = async () => urlFormat
        })(),
}))

const token = {
    access_token: 'abc',
    client_id: '123',
    expires_in: 1000,
}

const getAuthToken = async () => token

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
    {
        type: 'Feature',
        properties: {
            id: 'DiszpKrYNg8',
            name: 'Ngelehun CHC',
        },
        geometry: {
            type: 'Point',
            coordinates: [-11, 8],
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

const buffer = 1000

const options = {
    getAuthToken,
    datasetId,
    filter,
    data,
    params,
    legend,
    buffer,
    onLoad,
}

describe('EarthEngine', () => {
    it('Should initialize', () => {
        const layer = new EarthEngine()

        expect(layer.getId()).not.toBeNull()
    })

    it('Should add to map', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)

        expect(layer.getMap()).toBe(mockMap)
        expect(layer.getMapGL()).toBe(mockMapGL)

        await expect(layer.options.getAuthToken()).resolves.toEqual(token)
    })

    it('Should create a raster source', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)
        const id = layer.getId()
        const source = layer.getSource()[`${id}-raster`]

        expect(source).not.toBeUndefined()
        expect(source.type).toBe('raster')
        expect(source.tiles[0]).toBe(urlFormat)
    })

    it('Should create a geojson source', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)
        const id = layer.getId()
        const source = layer.getSource()[id]

        expect(source).not.toBeUndefined()
        expect(source.type).toBe('geojson')
    })

    it('Should create a raster and geojson layers', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)
        const id = layer.getId()
        const layers = layer.getLayers()
        const [layer1, layer2, layer3, layer4] = layers

        expect(layers.length).toBe(4)
        expect(layer1.type).toBe('raster')
        expect(layer1.id).toBe(`${id}-raster`)
        expect(layer1.source).toBe(`${id}-raster`)
        expect(layer2.type).toBe('fill')
        expect(layer2.id).toBe(`${id}-polygon`)
        expect(layer2.source).toBe(id)
        expect(layer3.type).toBe('line')
        expect(layer3.id).toBe(`${id}-outline`)
        expect(layer3.source).toBe(id)
        expect(layer4.type).toBe('circle')
        expect(layer4.id).toBe(`${id}-point`)
        expect(layer4.source).toBe(`${id}-points`)
    })

    it('Should not create geojson layers if feature data is missing', async () => {
        const layer = new EarthEngine({ ...options, data: null })
        await layer.addTo(mockMap)

        expect(layer.getLayers().length).toBe(1)
    })

    it('Should call onLoad option when loaded', async () => {
        const layer = new EarthEngine(options)
        const numCalls = onLoad.mock.calls.length
        await layer.addTo(mockMap)

        expect(onLoad.mock.calls.length).toBe(numCalls + 1)
    })

    it('Should convert point feature to buffer polygon', async () => {
        const layer = new EarthEngine(options)
        const features = layer.getFeatures()

        expect(features.some(f => f.geometry.type === 'Point')).toBe(false)
    })
})
