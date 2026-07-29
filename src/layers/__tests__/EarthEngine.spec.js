/* global mockMap, mockMapGL */
import EarthEngine from '../EarthEngine.js'

const urlFormat =
    'https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/.../tiles/{z}/{x}/{y}'

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

const style = [
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
    style,
    buffer,
    onLoad,
}

describe('EarthEngine', () => {
    beforeAll(() => {
        /* Ideally the default export from 'earthengine/ee_worker_loader'
         * should have been mocked instead of this, but since that function
         * returns a proxy from the ComLink library, it was difficult to mock.
         * If we ever want to add tests for the `getWorkerInstance` method
         * itself we will have to find a way to mock that `getEarthEngineWorker`
         * function. */
        jest.spyOn(
            EarthEngine.prototype,
            'getWorkerInstance'
        ).mockImplementation(async () => {
            class EarthEngineWorkerMock {
                getTileUrl = async () => urlFormat
            }
            const worker = new EarthEngineWorkerMock()
            return Promise.resolve(worker)
        })
    })

    afterAll(() => {
        jest.restoreAllMocks()
    })
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

    it('Should create an empty mask source', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)
        const id = layer.getId()
        const source = layer.getSource()[`${id}-mask`]

        expect(source).not.toBeUndefined()
        expect(source.type).toBe('geojson')
        expect(source.data).toEqual({ type: 'FeatureCollection', features: [] })
    })

    it('Should create a raster, mask and geojson layers', async () => {
        const layer = new EarthEngine(options)
        await layer.addTo(mockMap)
        const id = layer.getId()
        const layers = layer.getLayers()
        const [layer1, layer2, layer3, layer4, layer5] = layers

        expect(layers.length).toBe(5)
        expect(layer1.type).toBe('raster')
        expect(layer1.id).toBe(`${id}-raster`)
        expect(layer1.source).toBe(`${id}-raster`)
        expect(layer2.type).toBe('fill')
        expect(layer2.id).toBe(`${id}-mask`)
        expect(layer2.source).toBe(`${id}-mask`)
        expect(layer3.type).toBe('fill')
        expect(layer3.id).toBe(`${id}-polygon`)
        expect(layer3.source).toBe(id)
        expect(layer4.type).toBe('line')
        expect(layer4.id).toBe(`${id}-outline`)
        expect(layer4.source).toBe(id)
        expect(layer5.type).toBe('circle')
        expect(layer5.id).toBe(`${id}-point`)
        expect(layer5.source).toBe(`${id}-points`)
    })

    it('Should not create geojson or mask layers if feature data is missing', async () => {
        const layer = new EarthEngine({ ...options, data: null })
        await layer.addTo(mockMap)

        expect(layer.getLayers().length).toBe(1)
        expect(layer.getSource()[`${layer.getId()}-mask`]).toBeUndefined()
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

    it('Should not create layers twice when a newer addTo() call supersedes an in-flight one', async () => {
        const layer = new EarthEngine(options)

        const firstAdd = layer.addTo(mockMap)
        const secondAdd = layer.addTo(mockMap)

        await Promise.all([firstAdd, secondAdd])

        // 4, not 8 - a duplicate createLayers() call would double this
        expect(layer.getLayers().length).toBe(4)
    })

    it('Should not add the layer back after being removed while an addTo() call is still in flight', async () => {
        const layer = new EarthEngine(options)

        const firstAdd = layer.addTo(mockMap)
        layer.removeFrom(mockMap)

        await firstAdd

        expect(layer.getLayers().length).toBe(0)
    })

    describe('raster mask (filter/setVisibleIds)', () => {
        const featureIds = f =>
            f.features.map(({ properties }) => properties.id)

        const addLayerWithMaskSource = async (layerOptions = options) => {
            const layer = new EarthEngine(layerOptions)
            const maskSource = { setData: jest.fn() }
            mockMapGL.getSource.mockImplementation(id =>
                id === `${layer.getId()}-mask`
                    ? maskSource
                    : { setData: jest.fn() }
            )
            await layer.addTo(mockMap)
            return { layer, maskSource }
        }

        beforeEach(() => {
            mockMapGL.getSource.mockReset()
            mockMapGL.getStyle.mockReturnValue({ layers: [] })
        })

        it('filter() masks the features it excludes', async () => {
            const { layer, maskSource } = await addLayerWithMaskSource()

            layer.filter(['O6uvpzGd5pu'])

            expect(
                featureIds(maskSource.setData.mock.lastCall[0]).sort()
            ).toEqual(['DiszpKrYNg8', 'fdc6uOvgoji'].sort())
        })

        it('setVisibleIds() masks the features it excludes', async () => {
            const { layer, maskSource } = await addLayerWithMaskSource()

            layer.setVisibleIds(['O6uvpzGd5pu'])

            expect(
                featureIds(maskSource.setData.mock.lastCall[0]).sort()
            ).toEqual(['DiszpKrYNg8', 'fdc6uOvgoji'].sort())
        })

        it('masks the union of both exclusions when filter() and setVisibleIds() are both active', async () => {
            const { layer, maskSource } = await addLayerWithMaskSource()

            layer.filter(['fdc6uOvgoji', 'DiszpKrYNg8'])
            layer.setVisibleIds(['O6uvpzGd5pu', 'fdc6uOvgoji'])

            expect(
                featureIds(maskSource.setData.mock.lastCall[0]).sort()
            ).toEqual(['DiszpKrYNg8', 'O6uvpzGd5pu'].sort())
        })

        it('clears the mask when both filters are reset', async () => {
            const { layer, maskSource } = await addLayerWithMaskSource()

            layer.filter(['O6uvpzGd5pu'])
            layer.filter(null)
            layer.setVisibleIds(null)

            expect(featureIds(maskSource.setData.mock.lastCall[0])).toEqual([])
        })

        it('does not throw when the mask source is not available', async () => {
            const layer = new EarthEngine({ ...options, data: null })
            mockMapGL.getSource.mockReturnValue(undefined)
            await layer.addTo(mockMap)

            expect(() => layer.filter(['O6uvpzGd5pu'])).not.toThrow()
            expect(() => layer.setVisibleIds(['O6uvpzGd5pu'])).not.toThrow()
        })
    })
})
