import { fonts } from './labels.js'

// Longest names first - "Bold Italic" is a substring of "Bold", so it must
// be checked first or the shorter name would match instead.
const ownFontNames = Object.values(fonts).sort((a, b) => b.length - a.length)

// A vector-style basemap replaces the map's whole (global) glyphs URL, so
// redirect our own fonts by name - the basemap's own labels stay untouched.
export const createFontTransformRequest = glyphsUrl => {
    const ownGlyphsBaseUrl = glyphsUrl?.split('{fontstack}')[0]

    return (url, resourceType) => {
        if (resourceType !== 'Glyphs' || !ownGlyphsBaseUrl) {
            return null
        }

        const font = ownFontNames.find(name => url.includes(name))
        if (!font || url.startsWith(ownGlyphsBaseUrl)) {
            return null
        }

        const range = url.slice(url.lastIndexOf('/') + 1)
        return { url: `${ownGlyphsBaseUrl}${font}/${range}` }
    }
}
