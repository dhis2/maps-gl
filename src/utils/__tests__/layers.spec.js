import {
    pointLayer,
    lineLayer,
    polygonLayer,
    outlineLayer,
    symbolLayer,
    clusterLayer,
    clusterCountLayer,
} from '../layers'
import defaults from '../style'

const id = 'abc'
const color = '#000000'
const opacity = 0.5

describe('layers', () => {
    it('Should set opacity for different layer types', () => {
        expect(pointLayer({ id, color, opacity }).paint['circle-opacity']).toBe(
            opacity
        )
        expect(lineLayer({ id, opacity }).paint['line-opacity']).toBe(opacity)
        expect(polygonLayer({ id, color, opacity }).paint['fill-opacity']).toBe(
            opacity
        )
        expect(outlineLayer({ id, opacity }).paint['line-opacity']).toBe(
            opacity
        )
        expect(symbolLayer({ id, opacity }).paint['icon-opacity']).toBe(opacity)
        expect(clusterLayer({ id, opacity }).paint['circle-opacity']).toBe(
            opacity
        )
        expect(clusterCountLayer({ id, opacity }).paint['text-opacity']).toBe(
            opacity
        )
    })

    it('Should set default opacity for different layer types', () => {
        expect(pointLayer({ id, color }).paint['circle-opacity']).toBe(
            defaults.opacity
        )
        expect(lineLayer({ id }).paint['line-opacity']).toBe(defaults.opacity)
        expect(polygonLayer({ id, color }).paint['fill-opacity']).toBe(
            defaults.opacity
        )
        expect(outlineLayer({ id }).paint['line-opacity']).toBe(
            defaults.opacity
        )
        expect(symbolLayer({ id }).paint['icon-opacity']).toBe(defaults.opacity)
        expect(clusterLayer({ id }).paint['circle-opacity']).toBe(
            defaults.opacity
        )
        expect(clusterCountLayer({ id }).paint['text-opacity']).toBe(
            defaults.opacity
        )
    })
})
