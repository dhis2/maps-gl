import { setTemplate } from '../core'

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
})
