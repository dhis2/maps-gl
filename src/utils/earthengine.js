export const getCrs = ee => image => {
    const instance = image instanceof ee.ImageCollection ? image.first() : image
    const { crs, transform: crsTransform } = instance.projection().getInfo()
    return { crs, crsTransform }
}

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
