import { createFontTransformRequest } from '../glyphs.js'

const ownGlyphsUrl =
    'https://example.com/dhis-web-maps/fonts/{fontstack}/{range}.pbf'

const ownGlyphUrl = (font, range = '0-255') =>
    `https://example.com/dhis-web-maps/fonts/${font}/${range}.pbf`

const otherGlyphUrl = (font, range = '0-255') =>
    `https://tiles.openfreemap.org/fonts/${font}/${range}.pbf`

describe('createFontTransformRequest', () => {
    it('redirects a request for one of our own label fonts, regardless of source host', () => {
        const transformRequest = createFontTransformRequest(ownGlyphsUrl)

        expect(
            transformRequest(otherGlyphUrl('Open Sans Regular'), 'Glyphs')
        ).toEqual({
            url: ownGlyphUrl('Open Sans Regular'),
            credentials: 'include',
        })
    })

    it('redirects Open Sans Bold, preserving the requested range', () => {
        const transformRequest = createFontTransformRequest(ownGlyphsUrl)

        expect(
            transformRequest(
                otherGlyphUrl('Open Sans Bold', '256-511'),
                'Glyphs'
            )
        ).toEqual({
            url: ownGlyphUrl('Open Sans Bold', '256-511'),
            credentials: 'include',
        })
    })

    it('redirects Open Sans Italic', () => {
        const transformRequest = createFontTransformRequest(ownGlyphsUrl)

        expect(
            transformRequest(otherGlyphUrl('Open Sans Italic'), 'Glyphs')
        ).toEqual({
            url: ownGlyphUrl('Open Sans Italic'),
            credentials: 'include',
        })
    })

    it('redirects Open Sans Bold Italic without matching the shorter "Bold" name', () => {
        const transformRequest = createFontTransformRequest(ownGlyphsUrl)

        expect(
            transformRequest(otherGlyphUrl('Open Sans Bold Italic'), 'Glyphs')
        ).toEqual({
            url: ownGlyphUrl('Open Sans Bold Italic'),
            credentials: 'include',
        })
    })

    it("leaves a request for a font we don't render with untouched", () => {
        const transformRequest = createFontTransformRequest(ownGlyphsUrl)

        expect(
            transformRequest(otherGlyphUrl('Noto Sans Regular'), 'Glyphs')
        ).toBeNull()
    })

    it('adds credentials, without rewriting the url, when already going to our own server', () => {
        const transformRequest = createFontTransformRequest(ownGlyphsUrl)

        expect(
            transformRequest(ownGlyphUrl('Open Sans Regular'), 'Glyphs')
        ).toEqual({
            url: ownGlyphUrl('Open Sans Regular'),
            credentials: 'include',
        })
    })

    it('does not touch other resource types', () => {
        const transformRequest = createFontTransformRequest(ownGlyphsUrl)

        expect(
            transformRequest(otherGlyphUrl('Open Sans Regular'), 'Tile')
        ).toBeNull()
    })

    it('does not throw or redirect when no glyphs URL is configured', () => {
        const transformRequest = createFontTransformRequest(undefined)

        expect(() =>
            transformRequest(otherGlyphUrl('Open Sans Regular'), 'Glyphs')
        ).not.toThrow()
        expect(
            transformRequest(otherGlyphUrl('Open Sans Regular'), 'Glyphs')
        ).toBeNull()
    })
})
