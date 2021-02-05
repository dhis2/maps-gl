export const twoDecimals = value =>
    (Math.round(value * 100) / 100).toLocaleString()

// Rounds a number to d decimals
export const numberPrecision = d => {
    if (d === undefined) {
        return n => n
    }
    const m = Math.pow(10, d)
    return n => Math.round(n * m) / m
}

export const kmToMiles = value => value * 0.621371192

export const squareMetersToHectares = value => value / 10000

export const squareMetersToAcres = value => value / 4046.8564224
