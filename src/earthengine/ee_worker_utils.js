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

// unweighted means that centroids are used for each grid cell
// https://developers.google.com/earth-engine/guides/reducers_reduce_region#pixels-in-the-region
const createReducer = (eeReducer, type, unweighted) => {
    const reducer = eeReducer[type]()
    return unweighted ? reducer.unweighted() : reducer
}

// Combine multiple aggregation types/reducers
// https://developers.google.com/earth-engine/guides/reducers_intro
export const combineReducers = ee => (types, unweighted) =>
    types.reduce(
        (r, t, i) =>
            i === 0
                ? createReducer(r, t, unweighted)
                : r.combine({
                      reducer2: createReducer(ee.Reducer, t, unweighted),
                      sharedInputs: true,
                  }),
        ee.Reducer
    )

// Returns the linear scale in meters of the units of this projection
export const getScale = image => image.select(0).projection().nominalScale()

// Returns histogram data (e.g. landcover) in percentage, hectares or acres
export const getHistogramStatistics = ({
    data,
    scale,
    aggregationType,
    style,
}) =>
    data.features.reduce((obj, { id, properties }) => {
        const { histogram } = properties
        const sum = Object.values(histogram).reduce((a, b) => a + b, 0)

        obj[id] = style.reduce((values, { value: id }) => {
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

// Classify image according to style
export const getClassifiedImage = (eeImage, { legend = [], style, band }) => {
    // Image has classes (e.g. landcover)
    if (Array.isArray(style)) {
        return {
            eeImage: eeImage.remap({
                from: style.map(s => s.value),
                to: [...Array(style.length).keys()],
                bandName: band,
            }),
            params: {
                min: 0,
                max: style.length - 1,
                palette: style.map(l => l.color).join(','),
            },
        }
    } else if (style.bands) {
        // Satellite image
        return { eeImage, params: style }
    }

    const min = 0
    const max = legend.length - 1
    const { palette } = style
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

// Apply filter to image collection
export const applyFilter = (ee, collection, filter = []) => {
    let filtered = collection

    filter.forEach(f => {
        if (ee.Filter[f.type]) {
            filtered = filtered.filter(
                ee.Filter[f.type].apply(this, f.arguments)
            )
        }
    })

    return filtered
}

// Apply methods to image cells
export const applyMethods = (eeImage, methods = []) => {
    let image = eeImage

    if (Array.isArray(methods)) {
        methods.forEach(m => {
            if (image[m.name]) {
                image = image[m.name].apply(image, m.arguments)
            }
        })
    } else {
        // Backward compatibility for format used before 2.40
        Object.keys(methods).forEach(m => {
            if (image[m]) {
                image = image[m].apply(image, methods[m])
            }
        })
    }

    return image
}
