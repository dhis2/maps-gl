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

// Normalizes a scalar id, array of ids, or null/undefined into an array
export const normalizeIds = ids => {
    if (Array.isArray(ids)) {
        return ids
    }

    return ids ? [ids] : []
}

export const dropHiddenIds = (hoverIds, selectedIds, visibleIds) => {
    if (!visibleIds) {
        return null
    }

    const visible = new Set(visibleIds)

    return {
        hoverIds: hoverIds.filter(id => visible.has(id)),
        selectedIds: selectedIds.filter(id => visible.has(id)),
    }
}
