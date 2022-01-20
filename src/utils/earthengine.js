export const defaultEarthEngineOptions = {
    bandReducer: 'sum',
    popup: '{name}: {value} {unit}',
}

const earthEngineOptions = [
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

// Returns the layer options that should be passed to the EE worker
export const getEarthEngineOptions = options =>
    Object.keys(options)
        .filter(option => earthEngineOptions.includes(option))
        .reduce((obj, key) => {
            obj[key] = options[key]
            return obj
        }, {})
