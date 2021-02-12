import { squareMetersToHectares, squareMetersToAcres } from './numbers'

export const classAggregation = ['percentage', 'hectares', 'acres']

export const hasClasses = type => classAggregation.includes(type)

// Makes getInfo a promise
export const getInfo = instance =>
    new Promise((resolve, reject) =>
        instance.getInfo((data, error) => {
            if (error) {
                reject(error)
            } else {
                resolve(data)
            }
        })
    )

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
    getInfo(
        image
            .select(0)
            .projection()
            .nominalScale()
    )

// Returns histogram data (e.g. landcover) in percentage, hectares or acres
export const getHistogramStatistics = ({ data, scale, valueType, legend }) =>
    data.features.reduce((obj, { id, properties }) => {
        const { histogram } = properties
        const sum = Object.values(histogram).reduce((a, b) => a + b, 0)

        obj[id] = legend.reduce((values, { id }) => {
            const count = histogram[id] || 0
            const sqMeters = count * (scale * scale)
            let value

            switch (valueType) {
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
