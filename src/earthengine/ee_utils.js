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
