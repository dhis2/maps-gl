// Replaces {key} with data in a string template
export const setTemplate = (text, data) =>
    text.replace(/\{ *([\w_-]+) *\}/g, (_, key) => data[key] ?? '')

// Returns a string representation of an array of features
export const getFeaturesString = features =>
    Array.isArray(features)
        ? features
              .sort((a, b) => b.id - a.id)
              .map(({ id, source }) => `${id}-${source}`)
              .join('-')
        : ''

export const normalizeIds = ids => {
    if (Array.isArray(ids)) {
        return ids
    }

    return ids === undefined || ids === null ? [] : [ids]
}

// null and undefined both mean no ids
export const isSameIds = (ids, otherIds) => {
    if (!ids || !otherIds) {
        return !ids && !otherIds
    }

    return (
        ids.length === otherIds.length &&
        ids.every((id, index) => id === otherIds[index])
    )
}

// null/undefined visibleIdSet means no restriction
export const filterVisibleIds = (ids, visibleIdSet) =>
    visibleIdSet ? ids.filter(id => visibleIdSet.has(id)) : ids
