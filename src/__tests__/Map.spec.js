import Map from '../Map.js'

jest.mock('maplibre-gl', () => {
    const actualMapLibreGl = jest.requireActual('maplibre-gl')
    class MockMap {
        constructor() {
            Object.assign(this, global.mockMapGL)
        }
    }
    return {
        ...actualMapLibreGl,
        Map: MockMap,
    }
})

jest.mock('../earthengine/ee_worker_loader', () => ({
    __esModule: true,
    default: jest.fn(),
}))

describe('DHIS2 Maps-gl Map', () => {
    it('should initialize correctly', () => {
        const map = new Map('el')
        const mapgl = map.getMapGL()

        expect(mapgl).not.toBe(undefined)
        expect(mapgl).toEqual(global.mockMapGL)
        expect(mapgl.on).toHaveBeenCalledTimes(10)
    })

    it('should call setHoverState on mousemove when mousemove enabled', () => {
        const map = new Map('el')
        const setHoverStateSpy = jest.spyOn(map, 'setHoverState')

        const mockLayer = {
            isInteractive: () => true,
            getInteractiveIds: () => ['layer-1'],
            getFeaturesById: () => [{ id: 1, source: 'abc' }],
            hasLayerId: id => id === 'layer-1',
            getIndex: () => 0,
            onMouseMove: jest.fn(),
        }
        map._layers = [mockLayer]
        jest.spyOn(map, 'getLayers').mockReturnValue([mockLayer])

        map.getMapGL().queryRenderedFeatures = jest.fn(() => [
            {
                id: 1,
                source: 'abc',
                layer: { id: 'layer-1' },
                properties: { id: 1 },
            },
        ])

        map.setMouseMoveEnabled(true)

        map.onMouseMove({
            point: {},
            features: [
                {
                    id: 1,
                    source: 'abc',
                    layer: { id: 'layer-1' },
                    properties: { id: 1 },
                },
            ],
        })

        expect(setHoverStateSpy).toHaveBeenCalledWith([
            { id: 1, source: 'abc' },
        ])
    })

    it('should not call setHoverState on mousemove when mousemove disabled', () => {
        const map = new Map('el')
        const setHoverStateSpy = jest.spyOn(map, 'setHoverState')

        map.setMouseMoveEnabled(false)
        map.onMouseMove({ features: [{ id: 1, source: 'abc' }] })

        expect(setHoverStateSpy).not.toHaveBeenCalled()
    })
})
