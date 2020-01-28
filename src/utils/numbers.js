export const twoDecimals = value =>
    (Math.round(value * 100) / 100).toLocaleString()

export const kmToMiles = value => value * 0.621371192
