/* global mockMap, mockMapGL */
import { updateHighlightOverlay } from '../../utils/highlightOverlay.js'
import LayerGroup from '../LayerGroup.js'

jest.mock('../../utils/highlightOverlay.js')

const createMockSubLayer = (id, featureId) => ({
    id,
    getId: () => id,
    hasLayerId: layerId => layerId === id,
    getLayers: () => [{ id }],
    getFeaturesById: fid =>
        fid === featureId ? [{ id: featureId, source: id }] : [],
    addTo: jest.fn(),
    removeFrom: jest.fn(),
    setIndex: jest.fn(),
    setOpacity: jest.fn(),
    setVisibility: jest.fn(),
    isOnMap: () => true,
    isInteractive: () => true,
    getInteractiveIds: () => [id],
    move: jest.fn(),
    onMouseMove: jest.fn(),
    fire: jest.fn(),
    setVisibleIds: jest.fn(),
})

describe('LayerGroup', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('should resolve a sub-layer by its GL layer id', () => {
        const group = new LayerGroup()
        const layerA = createMockSubLayer('layer-a', 1)
        const layerB = createMockSubLayer('layer-b', 2)
        group._layers = [layerA, layerB]

        expect(group.getSubLayerFromId('layer-b')).toBe(layerB)
        expect(group.getSubLayerFromId('missing')).toBeUndefined()
    })

    it("should update each sub-layer's own highlight overlay directly, not a second group-level one", () => {
        // A group-level overlay would derive the same layer ids as each
        // sub-layer's own overlay (added in their addTo()), colliding.
        const group = new LayerGroup()
        const layerA = createMockSubLayer('layer-a', 1)
        const layerB = createMockSubLayer('layer-b', 2)
        group._layers = [layerA, layerB]
        group._map = mockMap

        group.highlight([1, 2])

        expect(updateHighlightOverlay).toHaveBeenCalledTimes(2)
        expect(updateHighlightOverlay).toHaveBeenCalledWith(mockMap, {
            id: 'layer-a',
            features: [{ id: 1, source: 'layer-a' }],
            color: undefined,
        })
        expect(updateHighlightOverlay).toHaveBeenCalledWith(mockMap, {
            id: 'layer-b',
            features: [{ id: 2, source: 'layer-b' }],
            color: undefined,
        })
        expect(mockMap.setHoverState).not.toHaveBeenCalled()
        expect(mockMap.setSelectedState).not.toHaveBeenCalled()
    })

    it("should clear each sub-layer's overlay for an empty array or null", () => {
        const group = new LayerGroup()
        group._layers = [createMockSubLayer('layer-a', 1)]
        group._map = mockMap

        group.highlight([])
        expect(updateHighlightOverlay).toHaveBeenLastCalledWith(mockMap, {
            id: 'layer-a',
            features: [],
            color: undefined,
        })

        group.highlight(null)
        expect(updateHighlightOverlay).toHaveBeenLastCalledWith(mockMap, {
            id: 'layer-a',
            features: [],
            color: undefined,
        })
    })

    it('should no-op when not yet added to a map', () => {
        const group = new LayerGroup()
        group._layers = [createMockSubLayer('layer-a', 1)]

        expect(() => group.highlight([1])).not.toThrow()
        expect(mockMapGL.setFeatureState).not.toHaveBeenCalled()
        expect(updateHighlightOverlay).not.toHaveBeenCalled()
    })

    it("should update each sub-layer's own overlay with selected ids", () => {
        const group = new LayerGroup()
        const layerA = createMockSubLayer('layer-a', 1)
        const layerB = createMockSubLayer('layer-b', 2)
        group._layers = [layerA, layerB]
        group._map = mockMap

        group.select([1, 2])

        expect(updateHighlightOverlay).toHaveBeenCalledTimes(2)
        expect(updateHighlightOverlay).toHaveBeenCalledWith(mockMap, {
            id: 'layer-a',
            features: [{ id: 1, source: 'layer-a' }],
            color: undefined,
        })
        expect(updateHighlightOverlay).toHaveBeenCalledWith(mockMap, {
            id: 'layer-b',
            features: [{ id: 2, source: 'layer-b' }],
            color: undefined,
        })
        expect(mockMap.setHoverState).not.toHaveBeenCalled()
        expect(mockMap.setSelectedState).not.toHaveBeenCalled()
    })

    it('should not conflate two sub-layers whose features happen to share the same numeric id', () => {
        // Each sub-layer independently auto-assigns ids starting at 1, so
        // id collisions across sub-layers are expected — scoping the lookup
        // to each sub-layer (rather than the group's aggregated
        // getFeaturesById) keeps them from bleeding into each other.
        const group = new LayerGroup()
        const layerA = createMockSubLayer('layer-a', 1)
        const layerB = createMockSubLayer('layer-b', 1)
        group._layers = [layerA, layerB]
        group._map = mockMap

        group.highlight([1])

        expect(updateHighlightOverlay).toHaveBeenCalledWith(mockMap, {
            id: 'layer-a',
            features: [{ id: 1, source: 'layer-a' }],
            color: undefined,
        })
        expect(updateHighlightOverlay).toHaveBeenCalledWith(mockMap, {
            id: 'layer-b',
            features: [{ id: 1, source: 'layer-b' }],
            color: undefined,
        })
    })

    it("should replay a pending highlight into each sub-layer's overlay once addTo() resolves, e.g. after a style reload", async () => {
        const group = new LayerGroup()
        const layerA = createMockSubLayer('layer-a', 1)
        group._layers = [layerA]
        group._map = mockMap

        group.highlight([1], '#FFC800')
        updateHighlightOverlay.mockClear()

        // Simulate the group being re-added
        // The previously recorded hover id/color must be flushed into each sub-layer's freshly (re)created overlay
        await group.addTo(mockMap)

        expect(updateHighlightOverlay).toHaveBeenCalledWith(mockMap, {
            id: 'layer-a',
            features: [{ id: 1, source: 'layer-a' }],
            color: '#FFC800',
        })
    })

    it("should drop a hovered/selected id from each sub-layer's overlay once setVisibleIds() filters it out", () => {
        const group = new LayerGroup()
        const layerA = createMockSubLayer('layer-a', 1)
        group._layers = [layerA]
        group._map = mockMap

        group.highlight([1])
        updateHighlightOverlay.mockClear()

        group.setVisibleIds(['some-other-id'])

        expect(updateHighlightOverlay).toHaveBeenLastCalledWith(mockMap, {
            id: 'layer-a',
            features: [],
            color: undefined,
        })
    })

    it('should restrict rendered features to the given ids across all sub-layers', () => {
        const group = new LayerGroup()
        const layerA = createMockSubLayer('layer-a', 1)
        const layerB = createMockSubLayer('layer-b', 2)
        group._layers = [layerA, layerB]

        group.setVisibleIds(['O6uvpzGd5pu'])

        expect(layerA.setVisibleIds).toHaveBeenCalledWith(['O6uvpzGd5pu'])
        expect(layerB.setVisibleIds).toHaveBeenCalledWith(['O6uvpzGd5pu'])
    })

    it('should wire its contextmenu listener synchronously, before sub-layers finish loading, so an event during that window is not dropped', () => {
        const group = new LayerGroup()
        const layerA = createMockSubLayer('layer-a', 1)
        // A sub-layer whose own addTo() is still pending (e.g. loading images)
        layerA.addTo = jest.fn(() => new Promise(() => {}))
        group._layers = [layerA]

        group.addTo(mockMap) // not awaited, mirroring Map#addLayer's timing

        group.fire('contextmenu', { feature: { layer: { id: 'layer-a' } } })

        expect(layerA.fire).toHaveBeenCalledWith(
            'contextmenu',
            expect.objectContaining({ feature: expect.anything() })
        )
    })

    it('should move each sub-layer (each sub-layer repositions its own overlay itself; the group has none of its own)', () => {
        const group = new LayerGroup()
        const layerA = createMockSubLayer('layer-a', 1)
        const layerB = createMockSubLayer('layer-b', 2)
        group._layers = [layerA, layerB]
        group._map = mockMap

        group.move()

        expect(layerA.move).toHaveBeenCalled()
        expect(layerB.move).toHaveBeenCalled()
        expect(mockMapGL.moveLayer).not.toHaveBeenCalled()
    })
})
