import { filterVisibleIds, normalizeIds, setTemplate } from '../core.js'

describe('core utils', () => {
    it('Should add values to template string', () => {
        expect(
            setTemplate('{name}: {value} {unit}', {
                name: 'Population',
                value: 123,
                unit: 'per hectare',
            })
        ).toBe('Population: 123 per hectare')

        expect(
            setTemplate('{name}: {noValue}', {
                name: 'Population',
                noValue: 'no value',
            })
        ).toBe('Population: no value')
    })

    describe('normalizeIds', () => {
        it('Should wrap a single id, including 0, which hover already treats as an id', () => {
            expect(normalizeIds('a')).toEqual(['a'])
            expect(normalizeIds(0)).toEqual([0])
        })

        it('Should return an array as is, and no ids for null/undefined', () => {
            expect(normalizeIds(['a', 'b'])).toEqual(['a', 'b'])
            expect(normalizeIds(null)).toEqual([])
            expect(normalizeIds(undefined)).toEqual([])
        })
    })

    describe('filterVisibleIds', () => {
        it('Should restrict ids to those also present in visibleIds', () => {
            expect(filterVisibleIds(['a', 'b', 'c'], ['b'])).toEqual(['b'])
        })

        it('Should return ids unchanged when visibleIds is null/undefined, meaning no restriction', () => {
            expect(filterVisibleIds(['a', 'b'], null)).toEqual(['a', 'b'])
            expect(filterVisibleIds(['a', 'b'], undefined)).toEqual(['a', 'b'])
        })

        it('Should not mutate either input array', () => {
            const ids = ['a', 'b']
            const visibleIds = ['b']

            filterVisibleIds(ids, visibleIds)

            expect(ids).toEqual(['a', 'b'])
            expect(visibleIds).toEqual(['b'])
        })
    })
})
