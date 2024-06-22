import {
    numberPrecision,
    getPrecision,
    setPrecision,
    kmToMiles,
    squareMetersToHectares,
    squareMetersToAcres,
} from '../numbers'

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

    it('Should format number', () => {
        expect(setPrecision(542.312321312)).toBe(542)
        expect(setPrecision(78.312321312)).toBe(78.3)
        expect(setPrecision(8.312321312)).toBe(8.31)
        expect(setPrecision(0.312321312)).toBe(0.312)

        expect(setPrecision(0.12345, 0)).toBe(0)
        expect(setPrecision(0.12345, 1)).toBe(0.1)
        expect(setPrecision(0.12345, 2)).toBe(0.12)
        expect(setPrecision(0.12345, 3)).toBe(0.123)
        expect(setPrecision(0.12345, 4)).toBe(0.1234) // ???
        expect(setPrecision(0.12345, 5)).toBe(0.12345)
    })

    it('Should convert km to miles', () => {
        expect(kmToMiles(1)).toBe(0.621371192)
    })
})
