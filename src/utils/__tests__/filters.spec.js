import { idFilter } from '../filters.js'

describe('idFilter', () => {
    it('matches string ids with a match expression', () => {
        expect(idFilter(['a', 'b'])).toEqual([
            'match',
            ['get', 'id'],
            ['a', 'b'],
            true,
            false,
        ])
    })

    it('drops duplicate ids, since match labels must be unique', () => {
        expect(idFilter(['a', 'a', 'b'])).toEqual([
            'match',
            ['get', 'id'],
            ['a', 'b'],
            true,
            false,
        ])
    })

    it('matches strings and integers in separate lists, since a match list takes one type', () => {
        expect(idFilter(['a', 1, 'b', 2])).toEqual([
            'any',
            ['match', ['get', 'id'], ['a', 'b'], true, false],
            ['match', ['get', 'id'], [1, 2], true, false],
        ])
    })

    it('falls back to in for ids a match list rejects', () => {
        expect(idFilter(['a', 'constructor', 1.5])).toEqual([
            'any',
            ['match', ['get', 'id'], ['a'], true, false],
            ['in', ['get', 'id'], ['literal', ['constructor', 1.5]]],
        ])
    })

    it('keeps no feature for an empty list', () => {
        expect(idFilter([])).toBe(false)
    })
})
