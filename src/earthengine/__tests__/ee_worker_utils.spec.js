import { hasClasses, getHistogramStatistics } from '../ee_worker_utils.js'

const scale = 1000

const style = [
    {
        value: 9,
        name: 'Savannas',
        color: '#d99125',
    },
    {
        value: 13,
        name: 'Urban and built-up',
        color: '#cc0202',
    },
]

const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 'O6uvpzGd5pu',
            properties: {
                histogram: {
                    2: 1,
                    4: 2,
                    7: 3,
                    8: 4,
                    10: 5,
                    12: 6,
                    13: 7,
                    14: 8,
                    17: 9,
                },
            },
        },
        {
            type: 'Feature',
            id: 'fdc6uOvgoji',
            properties: {
                histogram: {
                    2: 1,
                    4: 2,
                    5: 3,
                    8: 4,
                    9: 5,
                    10: 6,
                    12: 7,
                    13: 8,
                    14: 9,
                },
            },
        },
    ],
}

const sum = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 // Sum of histogram values
const toPercent = v => (v / sum) * 100
const toHectares = v => Math.round((v * (scale * scale)) / 10000)
const toAcres = v => Math.round((v * (scale * scale)) / 4046.8564224)

describe('earthengine', () => {
    it('Should return true if unit is class based', () => {
        expect(hasClasses('percentage')).toBe(true)
        expect(hasClasses('hectares')).toBe(true)
        expect(hasClasses('acres')).toBe(true)
        expect(hasClasses('sum')).toBe(false)
    })

    it('Should calculate percentage', () => {
        const aggregationType = 'percentage'
        const ids = data.features.map(f => f.id)

        const result = getHistogramStatistics({
            data,
            scale,
            aggregationType,
            style,
        })

        const itemA = result['O6uvpzGd5pu']
        const itemB = result['fdc6uOvgoji']

        expect(ids).toEqual(Object.keys(result))
        expect(Object.keys(itemA).length).toBe(style.length)
        expect(itemA['9']).toBe(toPercent(0))
        expect(itemA['13']).toBe(toPercent(7))
        expect(itemB['9']).toBe(toPercent(5))
        expect(itemB['13']).toBe(toPercent(8))
    })

    it('Should calculate hectares', () => {
        const aggregationType = 'hectares'

        const result = getHistogramStatistics({
            data,
            scale,
            aggregationType,
            style,
        })

        const itemA = result['O6uvpzGd5pu']
        const itemB = result['fdc6uOvgoji']

        expect(itemA['9']).toBe(toHectares(0))
        expect(itemA['13']).toBe(toHectares(7))
        expect(itemB['9']).toBe(toHectares(5))
        expect(itemB['13']).toBe(toHectares(8))
    })

    it('Should calculate acres', () => {
        const aggregationType = 'acres'

        const result = getHistogramStatistics({
            data,
            scale,
            aggregationType,
            style,
        })

        const itemA = result['O6uvpzGd5pu']
        const itemB = result['fdc6uOvgoji']

        expect(itemA['9']).toBe(toAcres(0))
        expect(itemA['13']).toBe(toAcres(7))
        expect(itemB['9']).toBe(toAcres(5))
        expect(itemB['13']).toBe(toAcres(8))
    })
})
