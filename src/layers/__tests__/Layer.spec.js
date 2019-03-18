import Layer from '../Layer'
import { addImages } from '../../utils/images'
jest.mock('../../utils/images')

const mockMapGL = {
    addLayer: jest.fn(),
    addSource: jest.fn(),
    getLayer: jest.fn(),
}
const mockMap = {
    getMapGL: () => mockMapGL,
}
describe('Layer', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })
    it('Should initialize', () => {
        const layer = new Layer()
        expect(layer._id).not.toBeNull()
    })
    it('Should add to map', () => {
        const layer = new Layer()
        layer.addTo(mockMap)
        expect(layer.getMap()).toBe(mockMap)
        expect(layer.getMapGL()).toBe(mockMapGL)
        mockMapGL.getLayer.mockReturnValueOnce(true)
        expect(layer.isOnMap()).toBe(true)
        expect(mockMapGL.getLayer).toHaveBeenCalledWith(layer._id)
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
})
