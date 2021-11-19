import { squareMetersToHectares, squareMetersToAcres } from '../utils/numbers'

const classAggregation = ['percentage', 'hectares', 'acres']

export const hasClasses = type => classAggregation.includes(type)

const workerOptions = [
    'aggregationType',
    'band',
    'bandReducer',
    'buffer',
    'data',
    'datasetId',
    'filter',
    'legend',
    'mask',
    'methods',
    'mosaic',
    'params',
]

export const getWorkerOptions = options =>
    Object.keys(options)
        .filter(option => workerOptions.includes(option))
        .reduce((obj, key) => {
            obj[key] = options[key]
            return obj
        }, {})

// Makes evaluate a promise
export const getInfo = instance =>
    new Promise((resolve, reject) =>
        instance.evaluate((data, error) => {
            if (error) {
                reject(error)
            } else {
                resolve(data)
            }
        })
    )

// Combine multiple aggregation types/reducers
// https://developers.google.com/earth-engine/guides/reducers_intro
export const combineReducers = ee => types =>
    types.reduce(
        (r, t, i) =>
            i === 0
                ? r[t]()
                : r.combine({
                      reducer2: ee.Reducer[t](),
                      sharedInputs: true,
                  }),
        ee.Reducer
    )

// Returns the linear scale in meters of the units of this projection
export const getScale = image =>
    image
        .select(0)
        .projection()
        .nominalScale()

// Returns visualisation params from legend
export const getParamsFromLegend = legend => {
    const keys = legend.map(l => l.id)
    const min = Math.min(...keys)
    const max = Math.max(...keys)
    const palette = legend.map(l => l.color).join(',')

    return { min, max, palette }
}

// Returns histogram data (e.g. landcover) in percentage, hectares or acres
export const getHistogramStatistics = ({
    data,
    scale,
    aggregationType,
    legend,
}) =>
    data.features.reduce((obj, { id, properties }) => {
        const { histogram } = properties
        const sum = Object.values(histogram).reduce((a, b) => a + b, 0)

        obj[id] = legend.reduce((values, { id }) => {
            const count = histogram[id] || 0
            const sqMeters = count * (scale * scale)
            let value

            switch (aggregationType) {
                case 'hectares':
                    value = Math.round(squareMetersToHectares(sqMeters))
                    break
                case 'acres':
                    value = Math.round(squareMetersToAcres(sqMeters))
                    break
                default:
                    value = (count / sum) * 100 // percentage
            }

            values[id] = value

            return values
        }, {})

        return obj
    }, {})

// Reduce a feature collection to an object of properties
export const getFeatureCollectionProperties = data =>
    data.features.reduce(
        (obj, f) => ({
            ...obj,
            [f.id]: f.properties,
        }),
        {}
    )

// Memomize a promise that is pending or fulfilled
// https://medium.com/globant/memoize-javascript-promises-for-performance-1c77117fb6b8
export const promiseMemoize = fn => {
    let cache
    return (...args) =>
        cache
            ? cache
            : (cache = fn(...args).catch(error => {
                  cache = undefined
                  return error
              }))
}
