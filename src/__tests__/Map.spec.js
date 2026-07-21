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

    it('should forward mousemove to the hovered layer and set the cursor when mousemove enabled', () => {
        const map = new Map('el')

        const mockLayer = {
            isInteractive: () => true,
            getInteractiveIds: () => ['layer-1'],
            getFeaturesById: () => [{ id: 1, source: 'abc' }],
            hasLayerId: id => id === 'layer-1',
            getIndex: () => 0,
            onMouseMove: jest.fn(),
            fire: jest.fn(),
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
        const canvas = { style: {} }
        map.getMapGL().getCanvas = jest.fn(() => canvas)

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

        expect(mockLayer.onMouseMove).toHaveBeenCalled()
        expect(canvas.style.cursor).toBe('pointer')
    })

    it('should not resolve a hovered feature on mousemove when mousemove disabled', () => {
        const map = new Map('el')
        const mockLayer = {
            isInteractive: () => true,
            getInteractiveIds: () => ['layer-1'],
            hasLayerId: id => id === 'layer-1',
            getIndex: () => 0,
            onMouseMove: jest.fn(),
            fire: jest.fn(),
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

        map.setMouseMoveEnabled(false)
        map.onMouseMove({ point: {}, features: [{ id: 1, source: 'abc' }] })

        expect(mockLayer.onMouseMove).not.toHaveBeenCalled()
    })

    describe('setSelectedState', () => {
        it('sets and clears selected feature-state independently of setHoverState', () => {
            const map = new Map('el')
            const feature = { id: 1, source: 'abc' }
            map.getMapGL().getSource = jest.fn(() => true)

            map.setSelectedState([feature])
            expect(map.getMapGL().setFeatureState).toHaveBeenCalledWith(
                feature,
                { selected: true }
            )

            map.setSelectedState(null)
            expect(map.getMapGL().setFeatureState).toHaveBeenCalledWith(
                feature,
                { selected: false }
            )
        })

        it('is never touched by the mousemove-driven hover-outline effect', () => {
            const map = new Map('el')
            const setSelectedStateSpy = jest.spyOn(map, 'setSelectedState')
            const mockLayer = {
                isInteractive: () => true,
                getInteractiveIds: () => ['layer-1'],
                getFeaturesById: () => [{ id: 1, source: 'abc' }],
                hasLayerId: id => id === 'layer-1',
                getIndex: () => 0,
                onMouseMove: jest.fn(),
                fire: jest.fn(),
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

            map.onMouseMove({ point: {} })

            expect(setSelectedStateSpy).not.toHaveBeenCalled()
        })

        it('writes the given color into feature-state alongside selected/hover', () => {
            const map = new Map('el')
            const feature = { id: 1, source: 'abc' }
            map.getMapGL().getSource = jest.fn(() => true)

            map.setSelectedState([feature], '#FFC800')
            expect(map.getMapGL().setFeatureState).toHaveBeenLastCalledWith(
                feature,
                { selected: true, highlightColor: '#FFC800' }
            )

            map.setHoverState([feature], '#FF0000')
            expect(map.getMapGL().setFeatureState).toHaveBeenLastCalledWith(
                feature,
                { hover: true, highlightColor: '#FF0000' }
            )
        })

        it('re-applies the same features with a different color (color is part of the dedup key)', () => {
            const map = new Map('el')
            const feature = { id: 1, source: 'abc' }
            map.getMapGL().getSource = jest.fn(() => true)

            map.setSelectedState([feature], '#FFC800')
            map.getMapGL().setFeatureState.mockClear()

            map.setSelectedState([feature], '#FF0000')
            expect(map.getMapGL().setFeatureState).toHaveBeenCalledWith(
                feature,
                { selected: true, highlightColor: '#FF0000' }
            )
        })

        it("a color-less call (native cursor tracking) doesn't erase a previously-set color, since setFeatureState merges", () => {
            const map = new Map('el')
            const feature = { id: 1, source: 'abc' }
            map.getMapGL().getSource = jest.fn(() => true)

            map.setSelectedState([feature], '#FFC800')
            map.getMapGL().setFeatureState.mockClear()

            // Same features, no color — e.g. the built-in per-pixel hover path
            map.setHoverState([feature])
            expect(map.getMapGL().setFeatureState).toHaveBeenCalledWith(
                feature,
                { hover: true }
            )
        })
    })

    describe('click events', () => {
        const setUpClickableLayer = (map, layerId, featureId) => {
            const mockLayer = {
                onClick: jest.fn(),
                hasLayerId: id => id === layerId,
                isInteractive: () => true,
                getInteractiveIds: () => [layerId],
            }
            map._layers = [mockLayer]
            jest.spyOn(map, 'getLayers').mockReturnValue([mockLayer])
            jest.spyOn(map, 'getLayerFromId').mockReturnValue(mockLayer)
            map.getMapGL().project = jest.fn(() => ({ x: 1, y: 2 }))
            map.getMapGL().queryRenderedFeatures = jest.fn(() => [
                {
                    id: featureId,
                    layer: { id: layerId },
                    properties: { id: featureId },
                },
            ])
            return mockLayer
        }

        it('passes ctrlKey/metaKey through to the click event', () => {
            const map = new Map('el')
            const mockLayer = setUpClickableLayer(map, 'layer-1', 1)

            map.onClick({
                lngLat: { lng: 1, lat: 2 },
                originalEvent: { ctrlKey: true, metaKey: false },
            })

            expect(mockLayer.onClick).toHaveBeenCalledWith(
                expect.objectContaining({ ctrlKey: true, metaKey: false })
            )
        })

        it('defaults ctrlKey/metaKey to false when there is no original DOM event', () => {
            const map = new Map('el')
            const mockLayer = setUpClickableLayer(map, 'layer-1', 1)

            map.onClick({ lngLat: { lng: 1, lat: 2 } })

            expect(mockLayer.onClick).toHaveBeenCalledWith(
                expect.objectContaining({ ctrlKey: false, metaKey: false })
            )
        })
    })

    describe('mouseenter/mouseleave', () => {
        const createMockLayer = (layerId, featureId) => ({
            isInteractive: () => true,
            getInteractiveIds: () => [layerId],
            getFeaturesById: () => [{ id: featureId, source: 'abc' }],
            hasLayerId: id => id === layerId,
            getIndex: () => 0,
            onMouseMove: jest.fn(),
            fire: jest.fn(),
        })

        const moveTo = (map, layerId, featureId) => {
            map.getMapGL().queryRenderedFeatures = jest.fn(() => [
                {
                    id: featureId,
                    source: 'abc',
                    layer: { id: layerId },
                    properties: { id: featureId },
                },
            ])
            map.onMouseMove({ point: {} })
        }

        it('fires mouseenter once when hovering onto a feature, not on every tick', () => {
            const map = new Map('el')
            const mockLayer = createMockLayer('layer-1', 1)
            map._layers = [mockLayer]
            jest.spyOn(map, 'getLayers').mockReturnValue([mockLayer])
            map.setMouseMoveEnabled(true)

            moveTo(map, 'layer-1', 1)
            moveTo(map, 'layer-1', 1)

            expect(mockLayer.fire).toHaveBeenCalledTimes(1)
            expect(mockLayer.fire).toHaveBeenCalledWith(
                'mouseenter',
                expect.objectContaining({ feature: expect.anything() })
            )
        })

        it('fires mouseenter for a feature whose id is 0, not treating it as "no feature"', () => {
            const map = new Map('el')
            const mockLayer = createMockLayer('layer-1', 0)
            map._layers = [mockLayer]
            jest.spyOn(map, 'getLayers').mockReturnValue([mockLayer])
            map.setMouseMoveEnabled(true)

            moveTo(map, 'layer-1', 0)

            expect(mockLayer.fire).toHaveBeenCalledWith(
                'mouseenter',
                expect.objectContaining({ feature: expect.anything() })
            )
        })

        it('fires mouseleave on the old target and mouseenter on the new one when the hovered feature changes', () => {
            const map = new Map('el')
            const layerA = createMockLayer('layer-a', 1)
            const layerB = createMockLayer('layer-b', 2)
            map._layers = [layerA, layerB]
            jest.spyOn(map, 'getLayers').mockReturnValue([layerA, layerB])
            map.setMouseMoveEnabled(true)

            moveTo(map, 'layer-a', 1)
            layerA.fire.mockClear()

            moveTo(map, 'layer-b', 2)

            expect(layerA.fire).toHaveBeenCalledWith('mouseleave')
            expect(layerB.fire).toHaveBeenCalledWith(
                'mouseenter',
                expect.objectContaining({ feature: expect.anything() })
            )
        })

        it('fires mouseleave on mouseout and resets tracked hover state', () => {
            const map = new Map('el')
            const mockLayer = createMockLayer('layer-1', 1)
            map._layers = [mockLayer]
            jest.spyOn(map, 'getLayers').mockReturnValue([mockLayer])
            map.setMouseMoveEnabled(true)

            moveTo(map, 'layer-1', 1)
            mockLayer.fire.mockClear()

            map.onMouseOut({})

            expect(mockLayer.fire).toHaveBeenCalledWith('mouseleave')
            expect(map._hoveredLayer).toBeNull()
            expect(map._hoveredFeatureId).toBeNull()
        })
    })
})
