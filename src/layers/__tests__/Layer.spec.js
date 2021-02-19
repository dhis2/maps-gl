import Layer from '../Layer'
jest.mock('../../utils/images')

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

        mockMapGL.getLayer.mockImplementation(x => x === layer.getId())
        const mockMapLayer = { id: 42 }

        layer.addTo(mockMap)
        layer.addLayer(mockMapLayer, true)

        expect(layer.getLayers()).toHaveLength(1)
        expect(layer.getLayers()[0].id).toBe(mockMapLayer.id)
        expect(layer.hasLayerId(42)).toBe(true)

        // expect(layer.isOnMap()).toBe(true)
        expect(layer.isVisible()).toBe(true)

        // expect(layer.isInteractive()).toBe(true)
        // expect(layer.getInteractiveIds()).toHaveLength(1)
        // expect(layer.getInteractiveIds()[0]).toBe(mockMapLayer.id)
    })
})
