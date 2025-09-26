import ee from './ee_api_js_worker.js'

const squareMetersToHectares = value => value / 10000

const squareMetersToAcres = value => value / 4046.8564224

const classAggregation = ['percentage', 'hectares', 'acres']

const DEFAULT_MASK_VALUE = 0

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
export const combineReducers = (types, unweighted) =>
    types.reduce(
        (r, t, i) =>
            i === 0
                ? createReducer(r, t, unweighted)
                : r.combine(createReducer(ee.Reducer, t, unweighted), '', true),
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
export const getClassifiedImage = (
    eeImage,
    { legend = [], style, band, maskOperator }
) => {
    // Use mask operator (e.g. mask out values below a certain threshold)
    // Only used for styling, not aggregations
    if (maskOperator && eeImage[maskOperator]) {
        eeImage = eeImage.updateMask(
            eeImage[maskOperator](style?.min || DEFAULT_MASK_VALUE)
        )
    }

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

    const sortedLegend = legend.slice().sort((a, b) => a.from - b.from)
    const min = 0
    const max = sortedLegend.length - 1
    const { palette } = style
    let zones

    for (let i = min, item; i < max; i++) {
        item = sortedLegend[i]

        if (!zones) {
            zones = eeImage.gt(item.to)
        } else {
            zones = zones.add(eeImage.gt(item.to))
        }
    }

    return { eeImage: zones, params: { min, max, palette } }
}

// Apply filter to image collection
export const applyFilter = (collection, filter = []) => {
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

// Mask out clouds from satellite images
export const applyCloudMask = (collection, cloudScore) => {
    const { datasetId, band, clearThreshold } = cloudScore

    return collection
        .linkCollection(ee.ImageCollection(datasetId), [band])
        .map(img => img.updateMask(img.select(band).gte(clearThreshold)))
}

// Converts a daily ImageCollection into monthly composites.
export const aggregateMonthly = (collection, reducer = ee.Reducer.mean()) => {
    const dateRange = collection.reduceColumns(ee.Reducer.minMax(), [
        'system:time_start',
    ])
    const minDate = ee.Date.fromYMD(
        ee.Date(dateRange.get('min')).get('year'),
        ee.Date(dateRange.get('min')).get('month'),
        1
    )
    const maxDate = ee.Date(dateRange.get('max')) //.advance(1, 'month') // Include last month
    const months = ee.List.sequence(0, maxDate.difference(minDate, 'month'))

    // Get original band names to rename after reduction
    const bandNames = ee.Image(collection.first()).bandNames()

    const monthlyImages = ee.ImageCollection.fromImages(
        months.map(m => {
            const startDate = minDate.advance(ee.Number(m), 'month')
            const endDate = startDate.advance(1, 'month')
            let monthlyCollection = ee.ImageCollection(
                collection.filterDate(startDate, endDate)
            )
            monthlyCollection = monthlyCollection.reduce(reducer)

            // Rename bands to remove reducer suffix
            monthlyCollection = monthlyCollection.rename(bandNames)

            return monthlyCollection.set({
                'system:time_start': startDate.millis(),
                'system:time_end': endDate.millis(),
                year: startDate.get('year'),
                month: startDate.get('month'),
                'system:index': startDate.format('YYYY_MM'),
            })
        })
    )

    return monthlyImages.sort('system:time_start', false)
}
