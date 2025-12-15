jest.mock('../ee_api_js_worker.js')
import ee from '../ee_api_js_worker.js'
import {
    DEFAULT_SCALE,
    filterCollectionByDateRange,
    getAdjustedScale,
    combineReducers,
    getScale,
    getClassifiedImage,
    applyFilter,
    applyMethods,
    applyCloudMask,
    aggregateTemporal,
    aggregateTemporalWeighted,
    selectBand,
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

    test('getAdjustedScale returns correct scale for all scenarios', () => {
        //  minArea < scale^2 → adjusted scale
        const fcSmall = ee.FeatureCollection('small')
        const resultSmall = getAdjustedScale(fcSmall, 10)
        expect(resultSmall._value).toBeCloseTo(1)

        // minArea > scale^2 → original scale
        const fcLarge = ee.FeatureCollection('large')
        const resultLarge = getAdjustedScale(fcLarge, 10)
        expect(resultLarge._value).toBeCloseTo(10)

        // eeScale > DEFAULT_SCALE → capped at DEFAULT_SCALE
        const fcDefault = ee.FeatureCollection('default')
        const resultDefault = getAdjustedScale(fcDefault, DEFAULT_SCALE * 10)
        expect(resultDefault._value).toBeCloseTo(DEFAULT_SCALE)
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

    test('selectBand handles no band, single band, and multiple bands with reducer', () => {
        // no band provided → returns original image
        const mockImage1 = { some: 'image' }
        const result1 = selectBand({ eeImage: mockImage1 })
        expect(result1.eeImage).toBe(mockImage1)
        expect(result1.eeImageBands).toBeUndefined()

        // single band string → selects that band
        const mockSelected = 'selectedImage'
        const mockImage2 = { select: jest.fn(() => mockSelected) }
        const result2 = selectBand({ eeImage: mockImage2, band: 'B1' })
        expect(mockImage2.select).toHaveBeenCalledWith('B1')
        expect(result2.eeImage).toBe(mockSelected)
        expect(result2.eeImageBands).toBeUndefined()

        // multiple bands with reducer → selects and reduces
        const reducedImage = 'reducedImage'
        const mockSelectedMulti = { reduce: jest.fn(() => reducedImage) }
        const mockImage3 = { select: jest.fn(() => mockSelectedMulti) }
        const result3 = selectBand({
            eeImage: mockImage3,
            band: ['B1', 'B2'],
            bandReducer: 'mean',
        })
        expect(mockImage3.select).toHaveBeenCalledWith(['B1', 'B2'])
        expect(ee.Reducer.mean).toHaveBeenCalled()
        const reducerInstance = ee.Reducer.mean.mock.results[0].value
        expect(mockSelectedMulti.reduce).toHaveBeenCalledWith(reducerInstance)
        expect(result3.eeImageBands).toBe(mockSelectedMulti)
        expect(result3.eeImage).toBe(reducedImage)
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

    test('applyMethods resolves expression argument bands and calls expression with vars', () => {
        const bandObj1 = { name: 'B1obj' }
        const bandObj2 = { name: 'B2obj' }
        const image = {
            select: jest.fn(name => (name === 'B1' ? bandObj1 : bandObj2)),
            expression: jest.fn((expr, vars) => ({ expr, vars })),
        }
        const methods = [
            {
                name: 'expression',
                arguments: ['b + c', { b: 'B1', c: 'B2' }],
            },
        ]

        const result = applyMethods(image, methods)
        expect(image.select).toHaveBeenCalledWith('B1')
        expect(image.select).toHaveBeenCalledWith('B2')
        expect(image.expression).toHaveBeenCalled()
        expect(result.expr).toBe('b + c')
        expect(result.vars).toEqual({ b: bandObj1, c: bandObj2 })
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
            overrideDate: undefined,
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
