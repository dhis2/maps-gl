import { squareMetersToHectares, squareMetersToAcres } from './numbers'

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

export const getCrs = ee => image =>
    new Promise(async (resolve, reject) => {
        const instance =
            image instanceof ee.ImageCollection ? image.first() : image

        instance
            .select(0) // First band
            .projection()
            .getInfo((data, error) => {
                if (error) {
                    reject(error)
                } else {
                    const { crs, transform: crsTransform } = data
                    resolve({ crs, crsTransform })
                }
            })
    })

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

export const getScale = image => getInfo(image.projection().nominalScale())

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

export const getFeatureCollectionProperties = data =>
    data.features.reduce(
        (obj, f) => ({
            ...obj,
            [f.id]: f.properties,
        }),
        {}
    )

// TODO: Possible to simplify? - move to app?
export const getPrecision = (values = []) => {
    if (values.length) {
        const sortedValues = [...values].sort((a, b) => a - b)
        const minValue = sortedValues[0]
        const maxValue = sortedValues[sortedValues.length - 1]
        const gapValue = maxValue - minValue
        const absMax = Math.abs(maxValue)

        if (absMax >= 10000) {
            return 0
        }

        if (absMax >= 1000) {
            return gapValue > 10 ? 0 : 1
        }

        if (absMax >= 100) {
            return gapValue > 1 ? 1 : 2
        }

        if (absMax >= 10) {
            return gapValue > 0.1 ? 2 : 3
        }

        if (absMax >= 1) {
            return gapValue > 0.01 ? 3 : 4
        }

        return gapValue > 0.001 ? 4 : 5
    }

    return 0
}
