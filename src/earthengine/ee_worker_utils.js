import ee from './ee_api_js_worker.js'

const squareMetersToHectares = value => value / 10000

const squareMetersToAcres = value => value / 4046.8564224

const classAggregation = ['percentage', 'hectares', 'acres']

const DEFAULT_MASK_VALUE = 0
export const EE_WEEKLY = 'EE_WEEKLY'
export const EE_WEEKLY_WEIGHTED = 'EE_WEEKLY_WEIGHTED'
export const EE_MONTHLY = 'EE_MONTHLY'
export const EE_MONTHLY_WEIGHTED = 'EE_MONTHLY_WEIGHTED'

export const hasClasses = type => classAggregation.includes(type)

export const getStartOfEpiYear = year => {
    const jan1 = new Date(year, 0, 1) // Month is 0-indexed (0 = Jan)
    const dayOfWeek = jan1.getDay() // Sunday=0, Monday=1, ..., Saturday=6

    const dayOfWeekMondayStart = dayOfWeek === 0 ? 7 : dayOfWeek
    let startDate
    if (dayOfWeekMondayStart <= 4) {
        const diff = dayOfWeekMondayStart - 1
        startDate = new Date(year, 0, 1 - diff)
    } else {
        const diff = 8 - dayOfWeekMondayStart
        startDate = new Date(year, 0, 1 + diff)
    }
    return startDate
}

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

// Generic temporal aggregation function for daily ImageCollections.
// Supported periods: 'month' and 'week'
export const aggregateTemporal = ({
    collection,
    metadataOnly = false,
    year = null,
    reducer = 'mean',
    periodReducer = EE_MONTHLY,
}) => {
    // Choose temporal reducer within period
    const temporalReducer =
        reducer === 'sum' ? ee.Reducer.sum() : ee.Reducer.mean()

    // Map periodReducer to period type
    let period
    switch (periodReducer) {
        case EE_WEEKLY:
        case EE_WEEKLY_WEIGHTED:
            period = 'week'
            break
        case EE_MONTHLY:
        case EE_MONTHLY_WEIGHTED:
        default:
            period = 'month'
            break
    }

    // Determine min/max dates
    const dateRange = collection.reduceColumns(ee.Reducer.minMax(), [
        'system:time_start',
    ])
    let minDate = ee.Date(dateRange.get('min'))
    const maxDate = ee.Date(dateRange.get('max'))

    // Align minDate to first of month if doing monthly aggregation
    if (period === 'month') {
        minDate = ee.Date.fromYMD(minDate.get('year'), minDate.get('month'), 1)
    }

    // Build list of temporal steps
    const stepList = ee.List.sequence(0, maxDate.difference(minDate, period))
    const bandNames = ee.Image(collection.first()).bandNames()

    // Build aggregated images
    const aggregatedImages = ee.ImageCollection.fromImages(
        stepList.map(i => {
            const startDate = minDate.advance(ee.Number(i), period)
            const endDate = startDate.advance(1, period).advance(-1, 'second')
            const tempYear = year || startDate.get('year')

            let image
            if (metadataOnly) {
                image = ee.Image(0)
            } else {
                const subCollection = collection.filterDate(startDate, endDate)
                image = subCollection.reduce(temporalReducer).rename(bandNames)
            }

            // Build period-specific metadata
            const metadata = {
                'system:time_start': startDate.millis(),
                'system:time_end': endDate.millis(),
                year: tempYear,
                'system:index': ee
                    .String(tempYear.toString())
                    .cat(
                        period === 'month'
                            ? startDate.format('MM')
                            : ee.String('W').cat(startDate.format('w'))
                    ),
            }

            if (period === 'month') {
                metadata.month = startDate.get('month')
            } else {
                metadata.week = startDate.format('w')
            }

            return image.set(metadata)
        })
    )

    return aggregatedImages.sort('system:time_start', false)
}

// Aggregates an ImageCollection (with system:time_start and system:time_end)
// into weighted composites, either monthly or weekly, based on overlap duration.
export const aggregateTemporalWeighted = ({
    collection,
    year,
    periodReducer = 'EE_MONTHLY_WEIGHTED',
}) => {
    let period
    switch (periodReducer) {
        case 'EE_WEEKLY_WEIGHTED':
            period = 'week'
            break
        case 'EE_MONTHLY_WEIGHTED':
        default:
            period = 'month'
            break
    }

    const dateRange = collection.reduceColumns(ee.Reducer.minMax(), [
        'system:time_start',
    ])
    let minDate = ee.Date(dateRange.get('min'))
    const maxDate = ee.Date(dateRange.get('max'))

    if (period === 'month') {
        minDate = ee.Date.fromYMD(minDate.get('year'), minDate.get('month'), 1)
    }

    const steps = ee.List.sequence(0, maxDate.difference(minDate, period))
    const bandNames = ee.Image(collection.first()).bandNames()

    // Map over each time step
    const weightedImages = steps.map(s => {
        const startDate = minDate.advance(ee.Number(s), period)
        const endDate = startDate.advance(1, period).advance(-1, 'second')

        // Compute overlap duration for each image
        const withOverlap = collection.map(img => {
            const imgStart = ee.Date(img.get('system:time_start'))
            const imgEnd = ee.Date(img.get('system:time_end'))

            const overlapStart = ee.Date(
                ee.Algorithms.If(
                    imgStart.millis().gt(startDate.millis()),
                    imgStart,
                    startDate
                )
            )
            const overlapEnd = ee.Date(
                ee.Algorithms.If(
                    imgEnd.millis().lt(endDate.millis()),
                    imgEnd,
                    endDate
                )
            )
            const overlapDuration = overlapEnd.difference(
                overlapStart,
                'second'
            )

            return img
                .updateMask(overlapDuration.gt(0))
                .set({ overlapDuration })
        })

        // Keep only overlapping images
        const overlapping = withOverlap.filter(
            ee.Filter.gt('overlapDuration', 0)
        )

        // Skip periods with no overlapping images
        return ee.Algorithms.If(
            overlapping.size().gt(0),
            (() => {
                // Weighted sum of images
                const weightedSum = ee.Image(
                    overlapping
                        .map(img => {
                            const duration = ee.Number(
                                img.get('overlapDuration')
                            )
                            return img
                                .toFloat()
                                .multiply(duration)
                                .addBands(
                                    ee.Image.constant(duration)
                                        .float()
                                        .rename('duration')
                                )
                        })
                        .reduce(
                            ee.Reducer.sum().forEach(bandNames.add('duration'))
                        )
                )

                // Total duration
                const totalDuration = ee.Image.constant(
                    overlapping.aggregate_sum('overlapDuration')
                ).float()

                // Weighted mean
                const weightedImage = weightedSum
                    .divide(totalDuration)
                    .rename(bandNames.add('duration'))
                    .select(bandNames)

                const tempYear = year || startDate.get('year')

                const metadata = {
                    'system:time_start': startDate.millis(),
                    'system:time_end': endDate.millis(),
                    year: tempYear,
                }

                if (period === 'month') {
                    metadata.month = startDate.get('month')
                    metadata['system:index'] = ee
                        .String(tempYear.toString())
                        .cat(startDate.format('MM'))
                } else {
                    metadata.week = startDate.format('w')
                    metadata['system:index'] = ee
                        .String(tempYear.toString())
                        .cat('W')
                        .cat(startDate.format('w'))
                }

                return weightedImage.set(metadata)
            })(),
            ee.Image([])
        )
    })

    return ee.ImageCollection.fromImages(weightedImages).sort(
        'system:time_start',
        false
    )
}
