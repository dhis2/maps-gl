import Layer from '../Layer'
import { addImages } from '../../utils/images'
jest.mock('../../utils/images')

const mockMapGL = {
    addLayer: jest.fn(),
    addSource: jest.fn(),
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
    })
})
