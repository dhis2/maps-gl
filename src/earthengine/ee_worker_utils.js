import ee from './ee_api_js_worker.js'

const squareMetersToHectares = value => value / 10000

const squareMetersToAcres = value => value / 4046.8564224

const classAggregation = ['percentage', 'hectares', 'acres']

const DEFAULT_MASK_VALUE = 0

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

// Converts a daily ImageCollection into monthly composites.
export const aggregateMonthly = ({
    collection,
    metadataOnly,
    year,
    reducer,
}) => {
    let temporalReducer
    switch (reducer) {
        case 'sum':
            temporalReducer = ee.Reducer.sum()
            break
        default:
            temporalReducer = ee.Reducer.mean()
            break
    }
    const dateRange = collection.reduceColumns(ee.Reducer.minMax(), [
        'system:time_start',
    ])
    const minDate = ee.Date.fromYMD(
        ee.Date(dateRange.get('min')).get('year'),
        ee.Date(dateRange.get('min')).get('month'),
        1
    )
    const maxDate = ee.Date(dateRange.get('max'))
    const months = ee.List.sequence(0, maxDate.difference(minDate, 'month'))

    const bandNames = ee.Image(collection.first()).bandNames()

    const monthlyImages = ee.ImageCollection.fromImages(
        months.map(m => {
            const startDate = minDate.advance(ee.Number(m), 'month')
            const endDate = startDate.advance(1, 'month').advance(-1, 'second')
            const tempYear = year || startDate.get('year')

            let image
            if (metadataOnly) {
                image = ee.Image(0) // Use a dummy image
            } else {
                const monthlyCollection = ee.ImageCollection(
                    collection.filterDate(startDate, endDate)
                )
                image = monthlyCollection
                    .reduce(temporalReducer)
                    .rename(bandNames)
            }

            return image.set({
                'system:time_start': startDate.millis(),
                'system:time_end': endDate.millis(),
                year: tempYear,
                month: startDate.get('month'),
                'system:index': ee
                    .String(tempYear.toString())
                    .cat(startDate.format('MM')),
            })
        })
    )

    return monthlyImages.sort('system:time_start', false)
}

// Aggregates a daily ImageCollection into weekly composites
export const aggregateWeekly = ({
    collection,
    metadataOnly,
    year,
    reducer,
}) => {
    let temporalReducer
    switch (reducer) {
        case 'sum':
            temporalReducer = ee.Reducer.sum()
            break
        default:
            temporalReducer = ee.Reducer.mean()
            break
    }
    const dateRange = collection.reduceColumns(ee.Reducer.minMax(), [
        'system:time_start',
    ])
    const minDate = ee.Date(dateRange.get('min'))
    const maxDate = ee.Date(dateRange.get('max'))
    const weeks = ee.List.sequence(0, maxDate.difference(minDate, 'week'))

    const bandNames = ee.Image(collection.first()).bandNames()

    const weeklyImages = ee.ImageCollection.fromImages(
        weeks.map(w => {
            const startDate = minDate.advance(ee.Number(w), 'week')
            const endDate = startDate.advance(1, 'week').advance(-1, 'second')
            const tempYear = year || startDate.get('year')

            let image
            if (metadataOnly) {
                image = ee.Image(0) // Use a dummy image
            } else {
                const weeklyCollection = ee.ImageCollection(
                    collection.filterDate(startDate, endDate)
                )
                image = weeklyCollection
                    .reduce(temporalReducer)
                    .rename(bandNames)
            }

            return image.set({
                'system:time_start': startDate.millis(),
                'system:time_end': endDate.millis(),
                year: tempYear,
                week: startDate.format('w'),
                'system:index': ee
                    .String(tempYear.toString())
                    .cat('W')
                    .cat(startDate.format('w')),
            })
        })
    )

    return weeklyImages.sort('system:time_start', false)
}

// Aggregates an ImageCollection (with system:time_start and system:time_end)
// into monthly composites, weighting each image by its overlap duration
// within the month.
export const aggregateMonthlyWeighted = ({ collection, year }) => {
    const dateRange = collection.reduceColumns(ee.Reducer.minMax(), [
        'system:time_start',
    ])
    const minDate = ee.Date.fromYMD(
        ee.Date(dateRange.get('min')).get('year'),
        ee.Date(dateRange.get('min')).get('month'),
        1
    )
    const maxDate = ee.Date(dateRange.get('max'))
    const months = ee.List.sequence(0, maxDate.difference(minDate, 'month'))

    const bandNames = ee.Image(collection.first()).bandNames()

    const monthlyImages = months.map(m => {
        const monthStartDate = minDate.advance(ee.Number(m), 'month')
        const monthEndDate = monthStartDate
            .advance(1, 'month')
            .advance(-1, 'second')

        // Compute overlap duration for each image
        const withOverlap = collection.map(img => {
            const imgStartDate = ee.Date(img.get('system:time_start'))
            const imgEndDate = ee.Date(img.get('system:time_end'))

            const overlapStart = ee.Date(
                ee.Algorithms.If(
                    imgStartDate.millis().gt(monthStartDate.millis()),
                    imgStartDate,
                    monthStartDate
                )
            )
            const overlapEnd = ee.Date(
                ee.Algorithms.If(
                    imgEndDate.millis().lt(monthEndDate.millis()),
                    imgEndDate,
                    monthEndDate
                )
            )
            const overlapDuration = overlapEnd.difference(
                overlapStart,
                'second'
            )

            return img
                .updateMask(overlapDuration.gt(0))
                .set({ overlapDuration: overlapDuration })
        })

        // Filter out images with zero overlap
        const overlapping = withOverlap.filter(
            ee.Filter.gt('overlapDuration', 0)
        )

        // Skip months with no overlapping images
        return ee.Algorithms.If(
            overlapping.size().gt(0),
            (() => {
                // Sum weighted images
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

                // Total duration as float
                const totalDuration = ee.Image.constant(
                    overlapping.aggregate_sum('overlapDuration')
                ).float()

                // Compute weighted mean and keep only original bands
                const monthlyImage = weightedSum
                    .divide(totalDuration)
                    .rename(bandNames.add('duration'))
                    .select(bandNames)

                const tempYear = year || monthStartDate.get('year')

                return monthlyImage.set({
                    'system:time_start': monthStartDate.millis(),
                    'system:time_end': monthEndDate.millis(),
                    year: tempYear,
                    ['month']: monthStartDate.get('month'),
                    'system:index': ee
                        .Number(tempYear)
                        .format('%d')
                        .cat(monthStartDate.format('MM')),
                })
            })(),
            ee.Image([])
        )
    })

    return ee.ImageCollection.fromImages(monthlyImages).sort(
        'system:time_start',
        false
    )
}

// Aggregates an ImageCollection (with system:time_start and system:time_end)
// into weekly composites, weighting each image by its overlap duration
// within the week.
export const aggregateWeeklyWeighted = ({ collection, year }) => {
    const dateRange = collection.reduceColumns(ee.Reducer.minMax(), [
        'system:time_start',
    ])
    const minDate = ee.Date(dateRange.get('min'))
    const maxDate = ee.Date(dateRange.get('max'))
    const weeks = ee.List.sequence(0, maxDate.difference(minDate, 'week'))

    const bandNames = ee.Image(collection.first()).bandNames()

    const weeklyImages = weeks.map(m => {
        const weekStartDate = minDate.advance(ee.Number(m), 'week')
        const weekEndDate = weekStartDate
            .advance(1, 'week')
            .advance(-1, 'second')

        // Compute overlap duration for each image
        const withOverlap = collection.map(img => {
            const imgStartDate = ee.Date(img.get('system:time_start'))
            const imgEndDate = ee.Date(img.get('system:time_end'))

            const overlapStart = ee.Date(
                ee.Algorithms.If(
                    imgStartDate.millis().gt(weekStartDate.millis()),
                    imgStartDate,
                    weekStartDate
                )
            )
            const overlapEnd = ee.Date(
                ee.Algorithms.If(
                    imgEndDate.millis().lt(weekEndDate.millis()),
                    imgEndDate,
                    weekEndDate
                )
            )
            const overlapDuration = overlapEnd.difference(
                overlapStart,
                'second'
            )

            return img
                .updateMask(overlapDuration.gt(0))
                .set({ overlapDuration: overlapDuration })
        })

        // Filter out images with zero overlap
        const overlapping = withOverlap.filter(
            ee.Filter.gt('overlapDuration', 0)
        )

        // Skip weeks with no overlapping images
        return ee.Algorithms.If(
            overlapping.size().gt(0),
            (() => {
                // Sum weighted images
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

                // Total duration as float
                const totalDuration = ee.Image.constant(
                    overlapping.aggregate_sum('overlapDuration')
                ).float()

                // Compute weighted mean and keep only original bands
                const weeklyImage = weightedSum
                    .divide(totalDuration)
                    .rename(bandNames.add('duration'))
                    .select(bandNames)

                const tempYear = year || weekStartDate.get('year')

                return weeklyImage.set({
                    'system:time_start': weekStartDate.millis(),
                    'system:time_end': weekEndDate.millis(),
                    year: tempYear,
                    ['week']: weekStartDate.format('w'),
                    'system:index': ee
                        .String(tempYear.toString())
                        .cat('W')
                        .cat(weekStartDate.format('w')),
                })
            })(),
            ee.Image([])
        )
    })

    return ee.ImageCollection.fromImages(weeklyImages).sort(
        'system:time_start',
        false
    )
}
