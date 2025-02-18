// Replaces {key} with data in a string template
export const setTemplate = (text, data) =>
    text.replace(/\{ *([\w_-]+) *\}/g, (str, key) => data[key])

// Returns a string representation of an array of features
export const getFeaturesString = (features) =>
    Array.isArray(features)
        ? features
              .sort((a, b) => b.id - a.id)
              .map(({ id, source }) => `${id}-${source}`)
              .join('-')
        : ''
