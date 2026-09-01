/* global mockMap, mockMapGL */
import Layer from '../Layer.js'

const data = [
    {
        type: 'Feature',
        properties: {
            id: 'O6uvpzGd5pu',
            name: 'Bo',
        },
        geometry: {
            type: 'Polygon',
            coordinates: [],
        },
    },
    {
        type: 'Feature',
        properties: {
            id: 'fdc6uOvgoji',
            name: 'Bombali',
        },
        geometry: {
            type: 'Polygon',
            coordinates: [],
        },
    },
]

describe('Layer', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        mockMap.styleIsLoaded.mockReturnValue(true)
    })
    it('Should initialize', () => {
        const layer = new Layer()
        expect(layer._id).not.toBeNull()
        expect(layer.getMap()).toBeUndefined()
        expect(layer.getMapGL()).toBeUndefined()
        mockMapGL.getLayer.mockReturnValueOnce(false)
        expect(layer.isOnMap()).toBe(false)
    })
    it('Should add to map', () => {
        const layer = new Layer()
        layer.addTo(mockMap)
        expect(layer.getMap()).toBe(mockMap)
        expect(layer.getMapGL()).toBe(mockMapGL)
        mockMapGL.getLayer.mockReturnValueOnce(true)
    })
    it('Should add a non-interactive layer', () => {
        const layer = new Layer()
        const mockMapLayer = { id: 42 }
        layer.addTo(mockMap)
        layer.addLayer(mockMapLayer)
        expect(layer.getLayers()).toHaveLength(1)
        expect(layer.getLayers()[0].id).toBe(mockMapLayer.id)
        expect(layer.hasLayerId(42)).toBe(true)
        expect(layer.isVisible()).toBe(true)
        expect(layer.isInteractive()).toBe(false)
        expect(layer.getInteractiveIds()).toHaveLength(0)
    })
    it('Should add an interactive layer', () => {
        const layer = new Layer()

        mockMapGL.getLayer.mockImplementation(x => x === layer.getId())
        const mockMapLayer = { id: 42 }

        layer.addTo(mockMap)
        layer.addLayer(mockMapLayer, { isInteractive: true })

        expect(layer.getLayers()).toHaveLength(1)
        expect(layer.getLayers()[0].id).toBe(mockMapLayer.id)
        expect(layer.hasLayerId(42)).toBe(true)
        expect(layer.isVisible()).toBe(true)
    })
    it('Should add data features and create numeric ids', () => {
        const layer = new Layer({ data })
        const features = layer.getFeatures()

        expect(features.length).toBe(data.length)
        expect(features.every(f => typeof f.id === 'number')).toBe(true)
        expect(layer.getFeaturesById(2)).toStrictEqual(
            layer.getFeaturesById('fdc6uOvgoji')
        )
        expect(layer.getFeaturesById(3)).toStrictEqual([])
    })
    it('Should set feature hover state', () => {
        const layer = new Layer({ data })
        const mockFn = mockMap.setHoverState
        const source = layer.getId()

        layer.addTo(mockMap)
        layer.highlight('fdc6uOvgoji')
        expect(mockFn).toHaveBeenCalled()
        expect(mockFn.mock.calls[0][0]).toMatchObject([
            {
                id: 2,
                source,
            },
        ])
        layer.highlight(1)
        expect(mockFn).toHaveBeenCalledTimes(2)
        expect(mockFn.mock.calls[1][0]).toMatchObject([
            {
                id: 1,
                source,
            },
        ])
        layer.highlight('abc')
        expect(mockFn).toHaveBeenCalledTimes(3)
        expect(mockFn).toHaveBeenLastCalledWith([])
    })
    it('Should apply opacity once the style is loaded', () => {
        const layer = new Layer()
        const layerId = `${layer.getId()}-polygon`
        mockMapGL.getStyle.mockReturnValue({
            layers: [{ id: layerId, type: 'polygon' }],
        })

        layer.addTo(mockMap)
        layer.setOpacity(0.5)

        expect(mockMapGL.setPaintProperty).toHaveBeenCalledWith(
            layerId,
            'fill-opacity',
            0.5
        )
        expect(layer.options.opacity).toBe(0.5)
    })
    it('Should not touch paint properties while the style is loading', () => {
        const layer = new Layer()
        mockMap.styleIsLoaded.mockReturnValue(false)

        layer.addTo(mockMap)

        expect(() => layer.setOpacity(0.5)).not.toThrow()
        expect(mockMapGL.getStyle).not.toHaveBeenCalled()
        expect(mockMapGL.setPaintProperty).not.toHaveBeenCalled()
        // The value is still kept, so it applies once re-added later
        expect(layer.options.opacity).toBe(0.5)
    })
    it('Should not remove layers or sources while the style is loading', () => {
        const layer = new Layer()
        layer.addLayer({ id: 'x-polygon' })
        layer.setSource('x', { type: 'geojson', data: {} })
        mockMapGL.getLayer.mockReturnValue(true)
        mockMapGL.getSource.mockReturnValue(true)
        mockMap.styleIsLoaded.mockReturnValue(false)

        expect(() => layer.removeFrom(mockMap)).not.toThrow()

        expect(mockMapGL.removeLayer).not.toHaveBeenCalled()
        expect(mockMapGL.removeSource).not.toHaveBeenCalled()
    })
    it('Should remove layers and sources once the style is loaded', () => {
        const layer = new Layer()
        layer.addLayer({ id: 'x-polygon' })
        layer.setSource('x', { type: 'geojson', data: {} })
        mockMapGL.getLayer.mockReturnValue(true)
        mockMapGL.getSource.mockReturnValue(true)

        layer.removeFrom(mockMap)

        expect(mockMapGL.removeLayer).toHaveBeenCalledWith('x-polygon')
        expect(mockMapGL.removeSource).toHaveBeenCalledWith('x')
    })
    it('Should only style sub-layers that actually exist', () => {
        const layer = new Layer()
        layer.addLayer({ id: 'x-polygon' })
        layer.addLayer({ id: 'x-point' })
        // Simulates a partially added/removed set of sub-layers
        mockMapGL.getLayer.mockImplementation(id => id === 'x-polygon')

        layer.addTo(mockMap)
        layer.setVisibility(false)

        expect(mockMapGL.setLayoutProperty).toHaveBeenCalledWith(
            'x-polygon',
            'visibility',
            'none'
        )
        expect(mockMapGL.setLayoutProperty).not.toHaveBeenCalledWith(
            'x-point',
            'visibility',
            expect.anything()
        )
    })
})
