export const defaultOptions = {
    bandReducer: 'sum',
    popup: '{name}: {value} {unit}',
    nullPopup: '{name}: {noValue}',
    noValue: 'no value',
}

const workerOptions = [
    'aggregationType',
    'band',
    'bandReducer',
    'buffer',
    'cloudScore',
    'data',
    'datasetId',
    'filter',
    'format',
    'legend',
    'mask',
    'methods',
    'mosaic',
    'periodReducer',
    'style',
    'tileScale',
    'useCentroid',
]

// Returns the layer options that should be passed to the EE worker
export const getWorkerOptions = opts => {
    const options = Object.keys(opts)
        .filter(option => workerOptions.includes(option))
        .reduce((obj, key) => {
            obj[key] = opts[key]
            return obj
        }, {})

    // Exclude point features if no buffer
    if (options.data && !options.buffer) {
        options.data = options.data.filter(d => d.geometry.type !== 'Point')
    }

    return options
}
