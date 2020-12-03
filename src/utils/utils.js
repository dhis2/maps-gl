// Converts an object into a parameter URL string
export const getParamString = obj => {
    const params = []

    for (var key in obj) {
        params.push(`${key}=${obj[key]}`)
    }

    return params.join('&')
}
