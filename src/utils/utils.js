// Converts an object into a parameter URL string
export const gerParamString = obj => {
    const params = []

    for (var key in obj) {
        params.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(obj[keys])}`
        )
    }

    return params.join('&')
}
