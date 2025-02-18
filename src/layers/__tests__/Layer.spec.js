import Layer from '../Layer'

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

        mockMapGL.getLayer.mockImplementation((x) => x === layer.getId())
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
        expect(features.every((f) => typeof f.id === 'number')).toBe(true)
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
        expect(mockFn).lastCalledWith([])
    })
})
