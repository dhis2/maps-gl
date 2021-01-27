import { sqMetersToSqKm } from './numbers'

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

        instance.projection().getInfo((data, error) => {
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

export const getHistogramStatistics = (data, scale, legend) =>
    data.features.reduce((obj, { id, properties }) => {
        const { histogram } = properties
        const sum = Object.values(histogram).reduce((a, b) => a + b, 0)

        obj[id] = legend.reduce((values, { id }) => {
            const count = histogram[id] || 0
            // const area = sqMetersToSqKm(count * (scale * scale))
            const percent = (count / sum) * 100

            // values[key] = { count, area, percent }
            values[id] = percent

            return values
        }, {})

        return obj
    }, {})
