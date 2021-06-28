import { isPoint } from '../geometry'

const point = {
    type: 'Feature',
    geometry: {
        type: 'Point',
        coordinates: [125.6, 10.1],
    },
}

const polygon = {
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [
            [
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ],
        ],
    },
}

describe('numbers', () => {
    it('Should return true if a feature has point geometry', () => {
        expect(isPoint(point)).toBe(true)
        expect(isPoint(polygon)).toBe(false)
    })
})
