import { dropHiddenIds, setTemplate } from '../core.js'

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

    describe('dropHiddenIds', () => {
        it('Should drop hover/selected ids that are no longer visible', () => {
            expect(dropHiddenIds(['a', 'b'], ['b', 'c'], ['b'])).toEqual({
                hoverIds: ['b'],
                selectedIds: ['b'],
            })
        })

        it('Should return null when visibleIds is null/undefined, so nothing is dropped', () => {
            expect(dropHiddenIds(['a'], ['b'], null)).toBeNull()
            expect(dropHiddenIds(['a'], ['b'], undefined)).toBeNull()
        })
    })
})
