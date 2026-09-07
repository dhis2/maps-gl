import Boundary from '../Boundary.js'

const feature = (style = {}) => ({
    type: 'Feature',
    properties: { style },
    geometry: { type: 'Point', coordinates: [0, 0] },
})

describe('Boundary#setFeatures', () => {
    it('falls back to the default stroke width when style.weight is missing', () => {
        const boundary = new Boundary({
            data: [feature({ color: '#fff' })],
            style: {},
        })

        expect(boundary.getFeatures()[0].properties.width).toBe(1)
    })

    it('uses style.weight when provided', () => {
        const boundary = new Boundary({
            data: [feature({ color: '#fff', weight: 3 })],
            style: {},
        })

        expect(boundary.getFeatures()[0].properties.width).toBe(3)
    })

    it('uses a weight of 0 as-is, rather than falling back to the default', () => {
        const boundary = new Boundary({
            data: [feature({ color: '#fff', weight: 0 })],
            style: {},
        })

        expect(boundary.getFeatures()[0].properties.width).toBe(0)
    })
})
