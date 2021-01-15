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
