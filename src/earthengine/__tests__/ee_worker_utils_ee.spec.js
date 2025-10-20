jest.mock('../ee_api_js_worker.js')
import ee from '../ee_api_js_worker.js'
import {
    filterCollectionByDateRange,
    combineReducers,
    getScale,
    getClassifiedImage,
    applyFilter,
    applyMethods,
    applyCloudMask,
    aggregateTemporal,
    aggregateTemporalWeighted,
    getAggregatorFn,
} from '../ee_worker_utils.js'

describe('EE-dependent functions (mocked)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('filterCollectionByDateRange calls ee.Filter.date and collection.filter', () => {
        const mockCollection = { filter: jest.fn() }
        const start = new Date('2020-01-01')
        const end = new Date('2020-12-31')

        filterCollectionByDateRange(mockCollection, start, end)

        expect(ee.Filter.date).toHaveBeenCalled()
        expect(mockCollection.filter).toHaveBeenCalled()
        expect(ee.Filter.or).toHaveBeenCalled()
    })

    test('combineReducers calls ee.Reducer.combine correctly', () => {
        combineReducers(['mean', 'sum'], false)

        expect(ee.Reducer.mean).toHaveBeenCalled()
        expect(ee.Reducer.sum).toHaveBeenCalled()
        expect(ee.Reducer.combine).toHaveBeenCalled()
    })

    test('getScale returns nominalScale value', () => {
        const image = ee.Image()
        const scale = getScale(image)
        expect(scale).toBe(30)
    })

    test('getClassifiedImage (array style) calls remap with correct structure', () => {
        const image = ee.Image()
        const style = [
            { value: 1, color: '#FF0000' },
            { value: 2, color: '#00FF00' },
        ]

        const result = getClassifiedImage(image, { style, band: 'B1' })

        expect(result.eeImage.remap).toBeDefined()
        expect(result.params.min).toBe(0)
        expect(result.params.max).toBe(1)
    })

    test('applyFilter calls ee.Filter and collection.filter', () => {
        const mockCollection = { filter: jest.fn() }
        const filters = [
            { type: 'date', arguments: ['2020-01-01', '2020-12-31'] },
        ]

        applyFilter(mockCollection, filters)
        expect(ee.Filter.date).toHaveBeenCalled()
        expect(mockCollection.filter).toHaveBeenCalled()
    })

    test('applyMethods applies image methods in sequence', () => {
        const image = {
            foo: jest.fn(() => image),
            bar: jest.fn(() => image),
        }
        const methods = [
            { name: 'foo', arguments: [1, 2] },
            { name: 'bar', arguments: [3] },
        ]

        const result = applyMethods(image, methods)
        expect(result).toBe(image)
        expect(image.foo).toHaveBeenCalledWith(1, 2)
        expect(image.bar).toHaveBeenCalledWith(3)
    })

    test('applyCloudMask links and maps correctly', () => {
        const collection = {
            linkCollection: jest.fn(() => ({ map: jest.fn(() => 'masked') })),
        }
        const cloudScore = {
            datasetId: 'dataset',
            band: 'B1',
            clearThreshold: 20,
        }

        const result = applyCloudMask(collection, cloudScore)
        expect(collection.linkCollection).toHaveBeenCalled()
        expect(result).toBe('masked')
    })

    test('aggregateTemporal returns an ImageCollection and calls necessary helpers', () => {
        const collection = ee.ImageCollection()
        const result = aggregateTemporal({
            collection,
            metadataOnly: true,
            year: 2020,
            reducer: 'mean',
        })

        // fromImages should have been called to build the aggregated collection
        expect(ee.ImageCollection.fromImages).toHaveBeenCalled()

        // Result should be an ImageCollection-like object (mock exposes sort)
        expect(result.sort).toBeDefined()

        // Inspect the images passed to fromImages: ensure they have metadata set
        const callArg = ee.ImageCollection.fromImages.mock.calls[0][0]
        // callArg is expected to be an array-like mapping (mock uses native array)
        if (Array.isArray(callArg)) {
            for (const img of callArg) {
                expect(img._meta).toBeDefined()
                expect(img._meta).toHaveProperty('system:time_start')
                expect(img._meta).toHaveProperty('system:time_end')
                expect(img._meta).toHaveProperty('year')
            }
        }
    })

    test('aggregateTemporalWeighted monthly returns ImageCollection and includes month metadata', () => {
        const collection = ee.ImageCollection()
        const result = aggregateTemporalWeighted({
            collection,
            year: 2020,
            periodReducer: 'EE_MONTHLY_WEIGHTED',
        })

        // fromImages should have been called to build the weighted collection
        expect(ee.ImageCollection.fromImages).toHaveBeenCalled()

        // Result should be an ImageCollection-like object (mock exposes sort)
        expect(result.sort).toBeDefined()

        // Inspect the images passed to fromImages: ensure they have metadata set
        const callArg = ee.ImageCollection.fromImages.mock.calls[0][0]
        if (Array.isArray(callArg)) {
            for (const img of callArg) {
                expect(img._meta).toBeDefined()
                expect(img._meta).toHaveProperty('system:time_start')
                expect(img._meta).toHaveProperty('system:time_end')
                expect(img._meta).toHaveProperty('year')
                // For monthly weighted, month should be present
                expect(img._meta).toHaveProperty('month')
            }
        }
    })

    test('aggregateTemporalWeighted weekly returns ImageCollection and includes week metadata', () => {
        const collection = ee.ImageCollection()
        const result = aggregateTemporalWeighted({
            collection,
            year: 2020,
            periodReducer: 'EE_WEEKLY_WEIGHTED',
        })

        // fromImages should have been called to build the weighted collection
        expect(ee.ImageCollection.fromImages).toHaveBeenCalled()

        // Result should be an ImageCollection-like object (mock exposes sort)
        expect(result.sort).toBeDefined()

        // Inspect the images passed to fromImages: ensure they have metadata set and include week
        const callArg = ee.ImageCollection.fromImages.mock.calls[0][0]
        if (Array.isArray(callArg)) {
            for (const img of callArg) {
                expect(img._meta).toBeDefined()
                expect(img._meta).toHaveProperty('system:time_start')
                expect(img._meta).toHaveProperty('system:time_end')
                expect(img._meta).toHaveProperty('year')
                // Weekly aggregation should include a week property
                expect(img._meta).toHaveProperty('week')
            }
        }
    })

    test('getAggregatorFn returns correct aggregator function', () => {
        const fnWeighted = getAggregatorFn('EE_MONTHLY_WEIGHTED')
        const fnNormal = getAggregatorFn('EE_MONTHLY')

        expect(fnWeighted).toBe(aggregateTemporalWeighted)
        expect(fnNormal).toBe(aggregateTemporal)
    })
})
