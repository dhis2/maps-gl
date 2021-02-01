export const twoDecimals = value =>
    (Math.round(value * 100) / 100).toLocaleString()

export const kmToMiles = value => value * 0.621371192

export const squareMetersToHectares = value => value / 10000

export const squareMetersToAcres = value => value / 4046.8564224
