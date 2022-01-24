// Replaces {xxx} with data in a string template
export const setTemplate = (text, data) =>
    text.replace(/\{ *([\w_-]+) *\}/g, (str, key) => data[key])
