import { numberPrecision, getPrecision } from '../numbers'

describe('numbers', () => {
    it('Should round number to x decimals', () => {
        const formatNumber = numberPrecision(3)

        expect(formatNumber(123.342342342)).toBe(123.342)
        expect(formatNumber(123.3456)).toBe(123.346)
        expect(formatNumber(123.39)).toBe(123.39)
    })

    it('Should return decimal precision based on value', () => {
        expect(getPrecision(542.312321312)).toBe(0)
        expect(getPrecision(78.312321312)).toBe(1)
        expect(getPrecision(8.312321312)).toBe(2)
        expect(getPrecision(0.312321312)).toBe(3)
    })
})
