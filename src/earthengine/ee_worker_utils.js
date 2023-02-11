const squareMetersToHectares = value => value / 10000

const squareMetersToAcres = value => value / 4046.8564224

const classAggregation = ['percentage', 'hectares', 'acres']

export const hasClasses = type => classAggregation.includes(type)

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
// unweighted means that centroids are used for each grid cell
// https://developers.google.com/earth-engine/guides/reducers_intro
export const combineReducers = ee => types =>
    types.reduce(
        (r, t, i) =>
            i === 0
                ? r[t]().unweighted()
                : r.combine({
                      reducer2: ee.Reducer[t]().unweighted(),
                      sharedInputs: true,
                  }),
        ee.Reducer
    )

// Returns the linear scale in meters of the units of this projection
export const getScale = image => image.select(0).projection().nominalScale()

// Returns visualisation params from legend
const getParamsFromLegend = legend => {
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

// Classify image according to legend
export const getClassifiedImage = (eeImage, { legend = [], params }) => {
    if (!params) {
        // Image has classes (e.g. landcover)
        return { eeImage, params: getParamsFromLegend(legend) }
    }

    const min = 0
    const max = legend.length - 1
    const { palette } = params
    let zones

    for (let i = min, item; i < max; i++) {
        item = legend[i]

        if (!zones) {
            zones = eeImage.gt(item.to)
        } else {
            zones = zones.add(eeImage.gt(item.to))
        }
    }

    return { eeImage: zones, params: { min, max, palette } }
}
