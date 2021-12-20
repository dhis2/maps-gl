// Rounds a number to d decimals
export const numberPrecision = d => {
    if (d === undefined) {
        return n => n
    }
    const m = Math.pow(10, d)
    return n => Math.round(n * m) / m
}

// Returns number of decimals based on the value
export const getPrecision = v => (v < 1 ? 3 : v < 10 ? 2 : v < 100 ? 1 : 0)

// Sets number of decimals based on the value
export const setPrecision = value =>
    numberPrecision(getPrecision(Math.abs(value)))(value)

export const kmToMiles = value => value * 0.621371192
