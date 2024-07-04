import {
    numberPrecision,
    getPrecision,
    setPrecision,
    kmToMiles,
} from '../numbers'

describe('numbers', () => {
    it('numberPrecision should round number to x decimals', () => {
        const formatNumber = numberPrecision(3)

        expect(formatNumber(123.342342342)).toBe(123.342)
        expect(formatNumber(123.3456)).toBe(123.346)
        expect(formatNumber(123.39)).toBe(123.39)
    })

    it('getPrecision should return decimal precision based on value', () => {
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
        expect(setPrecision(0.12345, 4)).toBe(0.1235)
        expect(setPrecision(0.12345, 5)).toBe(0.12345)
        expect(setPrecision(0.99999, 3)).toBe(1)
    })

    describe('setPrecision', () => {
        it('should set precision when no "precision" value provided', () => {
            expect(setPrecision(542.312321312)).toBe(542)
            expect(setPrecision(78.312321312)).toBe(78.3)
            expect(setPrecision(8.312321312)).toBe(8.31)
            expect(setPrecision(0.312321312)).toBe(0.312)
        })
        it('should set the precision of a positive number correctly', () => {
            const result = setPrecision(123.456, 2)
            expect(result).toEqual(123.46)
        })

        it('should set the precision of a negative number correctly', () => {
            const result = setPrecision(-123.456, 2)
            expect(result).toEqual(-123.46)
        })

        it('should handle zero correctly', () => {
            const result = setPrecision(0, 2)
            expect(result).toEqual(0)
        })
    })

    it('Should convert km to miles', () => {
        expect(kmToMiles(1)).toBe(0.621371192)
    })

    it('Should convert square meters to hectares', () => {
        expect(squareMetersToHectares(10000)).toBe(1)
    })

    it('Should convert square meters to acres', () => {
        expect(setPrecision(squareMetersToAcres(10000), 2)).toBe(2.47)
    })
})
