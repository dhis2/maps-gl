import { isPoint, isPolygon } from '../../utils/filters.js'
import Boundary from '../Boundary.js'

const feature = (style = {}) => ({
    type: 'Feature',
    properties: { style },
    geometry: { type: 'Point', coordinates: [0, 0] },
})

describe('Boundary#createLayers', () => {
    it('filters by geometry type with expressions, which setVisibleIds can combine with its id filter', () => {
        const boundary = new Boundary({ data: [feature()], style: {} })
        const [line, point] = boundary.getLayers()

        expect(line.filter).toEqual(isPolygon)
        expect(point.filter).toEqual(isPoint)
    })
})
