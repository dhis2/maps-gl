import EarthEngine, { defaultOptions } from '../EarthEngine'
import { featureCollection } from '../../utils/geometry'

jest.mock('../../utils/eeapi', () => ({
    __esModule: true,
    default: async () => ({}),
}))

const tilesUrl =
    'https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/.../tiles/{z}/{x}/{y}'

const onLoadMock = jest.fn()

describe('EarthEngine', () => {
    // https://stackoverflow.com/questions/50091438/jest-how-to-mock-one-specific-method-of-a-class
    beforeAll(() => {
        jest.spyOn(EarthEngine.prototype, 'setAuthToken').mockImplementation()
        jest.spyOn(EarthEngine.prototype, 'createImage').mockImplementation()
        jest.spyOn(EarthEngine.prototype, 'visualize').mockImplementation(
            () => ({
                urlFormat: tilesUrl,
            })
        )
    })

    afterAll(() => {
        jest.restoreAllMocks()
    })

    it('Should initialize', () => {
        const layer = new EarthEngine()

        expect(layer.getId()).not.toBeNull()
        expect(layer.options).toEqual(defaultOptions)
    })

    it('Should add to map', async () => {
        const layer = new EarthEngine()
        await layer.addTo(mockMap)

        expect(layer.getMap()).toBe(mockMap)
        expect(layer.getMapGL()).toBe(mockMapGL)
    })

    it('Should be backward compatible', () => {
        const layer = new EarthEngine({
            aggregation: 'mosaic',
        })

        expect(layer.options.mosaic).toBe(true)
    })

    it('Should create a raster and source', async () => {
        const layer = new EarthEngine()
        await layer.addTo(mockMap)
        const id = layer.getId()
        const source = layer.getSource()[id]

        expect(source).not.toBeUndefined()
        expect(source.type).toBe('raster')
        expect(source.tiles[0]).toBe(tilesUrl)
    })

    it('Should create a geojson source', async () => {
        const layer = new EarthEngine()
        await layer.addTo(mockMap)
        const id = layer.getId()
        const source = layer.getSource()[`${id}-features`]

        expect(source).not.toBeUndefined()
        expect(source.type).toBe('geojson')
        expect(source.data).toEqual(featureCollection())
    })

    it('Should create a raster and geojson layers', async () => {
        const layer = new EarthEngine()
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
        const layer = new EarthEngine({ onLoad: onLoadMock })
        await layer.addTo(mockMap)

        expect(onLoadMock.mock.calls.length).toBe(1)
    })
})
