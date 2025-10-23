import ee from './ee_api_js_worker.js'

const squareMetersToHectares = value => value / 10000

const squareMetersToAcres = value => value / 4046.8564224

const classAggregation = ['percentage', 'hectares', 'acres']

const DEFAULT_MASK_VALUE = 0
const EE_WEEKLY = 'EE_WEEKLY'
const EE_WEEKLY_WEIGHTED = 'EE_WEEKLY_WEIGHTED'
const EE_MONTHLY = 'EE_MONTHLY'
const EE_MONTHLY_WEIGHTED = 'EE_MONTHLY_WEIGHTED'

export const hasClasses = type => classAggregation.includes(type)

// Get the start date (UTC) of the epidemiological year for a given year
export const getStartOfEpiYear = year => {
    const jan1 = new Date(Date.UTC(year, 0, 1)) // Month is 0-indexed (0 = Jan)
    const dayOfWeek = jan1.getDay() // Sunday=0, Monday=1, ..., Saturday=6

    const dayOfWeekMondayStart = dayOfWeek === 0 ? 7 : dayOfWeek
    let startDate
    if (dayOfWeekMondayStart <= 4) {
        const diff = dayOfWeekMondayStart - 1
        startDate = new Date(Date.UTC(year, 0, 1 - diff))
    } else {
        const diff = 8 - dayOfWeekMondayStart
        startDate = new Date(Date.UTC(year, 0, 1 + diff))
    }
    return startDate
}

// Return JS Date start/end for the given period reducer and year
export const getPeriodDates = (periodReducer, year) => {
    switch (periodReducer) {
        case EE_WEEKLY:
        case EE_WEEKLY_WEIGHTED: {
            const start = getStartOfEpiYear(year)
            const end = new Date(
                getStartOfEpiYear(year + 1).getTime() - 24 * 60 * 60 * 1000
            )
            return { startDate: start, endDate: end }
        }
        case EE_MONTHLY:
        case EE_MONTHLY_WEIGHTED:
        default: {
            // Return plain JS Date objects for monthly period boundaries so callers
            // can work consistently with native dates (UTC midnight)
            return {
                startDate: new Date(Date.UTC(year, 0, 1)),
                endDate: new Date(Date.UTC(year, 11, 31)),
            }
        }
    }
}

// Filter an ImageCollection to images overlapping a JS Date range
export const filterCollectionByDateRange = (collection, startDate, endDate) => {
    return collection.filter(
        ee.Filter.or(
            ee.Filter.date(
                ee.Date(startDate.getTime()),
                ee.Date(endDate.getTime())
            ),
            ee.Filter.and(
                ee.Filter.lt('system:time_start', endDate.getTime()),
                ee.Filter.gt('system:time_end', startDate.getTime())
            )
        )
    )
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

// Unweighted means that centroids are used for each grid cell
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

// Map periodReducer string to period unit used by ee ("month" or "week")
const mapPeriodReducerToPeriod = periodReducer => {
    switch (periodReducer) {
        case EE_WEEKLY:
        case EE_WEEKLY_WEIGHTED:
            return 'week'
        case EE_MONTHLY:
        case EE_MONTHLY_WEIGHTED:
        default:
            return 'month'
    }
}

// Compute min/max dates for a collection and align the minDate for monthly periods
const computeMinMaxAndAlign = ({ collection, period, overrideDate }) => {
    const dateRange = collection.reduceColumns(ee.Reducer.minMax(), [
        'system:time_start',
    ])
    let minDate = overrideDate
        ? ee.Date(overrideDate.getTime())
        : ee.Date(dateRange.get('min'))
    const maxDate = ee.Date(dateRange.get('max'))

    if (period === 'month') {
        minDate = ee.Date.fromYMD(minDate.get('year'), minDate.get('month'), 1)
    }

    return { minDate, maxDate }
}

// Build steps sequence and band names for a collection given the period and min/max dates
const buildStepsAndBandNames = ({ minDate, maxDate, period, collection }) => {
    const steps = ee.List.sequence(0, maxDate.difference(minDate, period))
    const bandNames = ee.Image(collection.first()).bandNames()
    return { steps, bandNames }
}

// Build metadata object for a period (shared by temporal aggregators)
const buildPeriodMetadata = ({ startDate, endDate, period, tempYear }) => {
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
            .cat(ee.String('W'))
            .cat(startDate.format('w'))
    }

    return metadata
}

// Generic temporal aggregation function for daily ImageCollections.
// Supported periods: 'month' and 'week'
export const aggregateTemporal = ({
    collection,
    metadataOnly = false,
    year = null,
    reducer = 'mean',
    periodReducer = EE_MONTHLY,
    overrideDate,
}) => {
    const temporalReducer =
        reducer === 'sum' ? ee.Reducer.sum() : ee.Reducer.mean()

    const period = mapPeriodReducerToPeriod(periodReducer)
    const { minDate, maxDate } = computeMinMaxAndAlign({
        collection,
        period,
        overrideDate,
    })
    const { steps: stepList, bandNames } = buildStepsAndBandNames({
        minDate,
        maxDate,
        period,
        collection,
    })

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

            const metadata = buildPeriodMetadata({
                startDate,
                endDate,
                period,
                tempYear,
            })

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
    overrideDate,
}) => {
    const period = mapPeriodReducerToPeriod(periodReducer)
    const { minDate, maxDate } = computeMinMaxAndAlign({
        collection,
        period,
        overrideDate,
    })
    const { steps, bandNames } = buildStepsAndBandNames({
        minDate,
        maxDate,
        period,
        collection,
    })

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
                        .reduce(ee.Reducer.sum())
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
                const metadata = buildPeriodMetadata({
                    startDate,
                    endDate,
                    period,
                    tempYear,
                })
                return weightedImage.set(metadata)
            })(),
            null
        )
    })

    return ee.ImageCollection.fromImages(weightedImages).sort(
        'system:time_start',
        false
    )
}

export const getAggregatorFn = periodReducer => {
    return [EE_WEEKLY_WEIGHTED, EE_MONTHLY_WEIGHTED].includes(periodReducer)
        ? aggregateTemporalWeighted
        : aggregateTemporal
}
