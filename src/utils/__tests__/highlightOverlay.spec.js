import {
    getOverlaySourceId,
    createHighlightOverlay,
    updateHighlightOverlay,
    removeHighlightOverlay,
} from '../highlightOverlay.js'

const createMockMapgl = ({ existingSourceId, existingLayerId } = {}) => {
    // getSource(id) must return the same instance every call, like real maplibre-gl.
    const source = existingSourceId ? { setData: jest.fn() } : null

    return {
        addSource: jest.fn(),
        addLayer: jest.fn(),
        removeLayer: jest.fn(),
        removeSource: jest.fn(),
        setFeatureState: jest.fn(),
        getSource: jest.fn(id =>
            id === existingSourceId ? source : undefined
        ),
        getLayer: jest.fn(id => id === existingLayerId),
    }
}

const createMockMap = mapgl => ({
    getMapGL: () => mapgl,
})

describe('highlightOverlay', () => {
    it('clones eligible layers, halos icon layers, and skips fill/label layers', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)

        const overlayIds = createHighlightOverlay(map, {
            id: 'layer-1',
            glLayers: [
                { id: 'layer-1-point', type: 'circle', paint: {} },
                { id: 'layer-1-outline', type: 'line', paint: {} },
                {
                    id: 'layer-1-symbol',
                    type: 'symbol',
                    layout: { 'icon-image': ['get', 'iconUrl'] },
                },
                {
                    id: 'layer-1-label',
                    type: 'symbol',
                    layout: { 'text-field': '{name}' },
                },
                { id: 'layer-1-polygon', type: 'fill', paint: {} },
            ],
            beforeId: 'before-id',
        })

        expect(mapgl.addSource).toHaveBeenCalledWith(
            getOverlaySourceId('layer-1'),
            expect.objectContaining({ type: 'geojson' })
        )
        expect(overlayIds).toEqual([
            'layer-1-point-highlight',
            'layer-1-outline-highlight',
            'layer-1-symbol-highlight-halo',
            'layer-1-symbol-highlight-icon',
        ])
        expect(mapgl.addLayer).toHaveBeenCalledTimes(4)
        expect(mapgl.addLayer).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'layer-1-point-highlight',
                type: 'circle',
                source: getOverlaySourceId('layer-1'),
            }),
            'before-id'
        )
    })

    it('adds a colored halo behind the icon clone for icon layers', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)
        const isSymbolFilter = [
            'all',
            ['==', '$type', 'Point'],
            ['has', 'iconUrl'],
        ]

        const overlayIds = createHighlightOverlay(map, {
            id: 'layer-1',
            glLayers: [
                {
                    id: 'layer-1-symbol',
                    type: 'symbol',
                    layout: { 'icon-image': ['get', 'iconUrl'] },
                    filter: isSymbolFilter,
                },
            ],
            beforeId: undefined,
        })

        expect(overlayIds).toEqual([
            'layer-1-symbol-highlight-halo',
            'layer-1-symbol-highlight-icon',
        ])
        // Halo added first, so the icon clone renders on top of it.
        expect(mapgl.addLayer).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                id: 'layer-1-symbol-highlight-halo',
                type: 'circle',
                source: getOverlaySourceId('layer-1'),
                filter: isSymbolFilter,
                paint: expect.objectContaining({ 'circle-blur': 0.6 }),
            }),
            undefined
        )
        expect(mapgl.addLayer).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                id: 'layer-1-symbol-highlight-icon',
                type: 'symbol',
                source: getOverlaySourceId('layer-1'),
                layout: { 'icon-image': ['get', 'iconUrl'] },
                filter: isSymbolFilter,
            }),
            undefined
        )
    })

    it('omits the filter when the base layer has none, rather than matching everything', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)

        createHighlightOverlay(map, {
            id: 'layer-1',
            glLayers: [
                {
                    id: 'layer-1-symbol',
                    type: 'symbol',
                    layout: { 'icon-image': ['get', 'iconUrl'] },
                },
            ],
            beforeId: undefined,
        })

        expect(mapgl.addLayer.mock.calls[0][0].filter).toBeUndefined()
        expect(mapgl.addLayer.mock.calls[1][0].filter).toBeUndefined()
    })

    it('skips text-label symbol layers (text-field, not icon-image)', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)

        const overlayIds = createHighlightOverlay(map, {
            id: 'layer-1',
            glLayers: [
                {
                    id: 'layer-1-label',
                    type: 'symbol',
                    layout: { 'text-field': '{name}' },
                },
            ],
            beforeId: undefined,
        })

        expect(overlayIds).toEqual([])
        expect(mapgl.addLayer).not.toHaveBeenCalled()
    })

    it('never clones a fill layer', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)

        const overlayIds = createHighlightOverlay(map, {
            id: 'layer-1',
            glLayers: [{ id: 'layer-1-polygon', type: 'fill', paint: {} }],
            beforeId: undefined,
        })

        expect(overlayIds).toEqual([])
        expect(mapgl.addLayer).not.toHaveBeenCalled()
    })

    it('does not re-add a source/layer that already exists', () => {
        const mapgl = createMockMapgl({
            existingSourceId: getOverlaySourceId('layer-1'),
            existingLayerId: 'layer-1-point-highlight',
        })
        const map = createMockMap(mapgl)

        createHighlightOverlay(map, {
            id: 'layer-1',
            glLayers: [{ id: 'layer-1-point', type: 'circle', paint: {} }],
            beforeId: undefined,
        })

        expect(mapgl.addSource).not.toHaveBeenCalled()
        expect(mapgl.addLayer).not.toHaveBeenCalled()
    })

    it('updates the overlay source data and marks features hover+selected with the given color', () => {
        const mapgl = createMockMapgl({
            existingSourceId: getOverlaySourceId('layer-1'),
        })
        const map = createMockMap(mapgl)
        const source = mapgl.getSource(getOverlaySourceId('layer-1'))
        const feature = { id: 7, type: 'Feature', properties: {} }

        updateHighlightOverlay(map, {
            id: 'layer-1',
            features: [feature],
            color: '#FFC800',
        })

        expect(source.setData).toHaveBeenCalledWith({
            type: 'FeatureCollection',
            features: [{ ...feature, id: 1 }],
        })
        expect(mapgl.setFeatureState).toHaveBeenCalledWith(
            { source: getOverlaySourceId('layer-1'), id: 1 },
            { hover: true, selected: true, highlightColor: '#FFC800' }
        )
    })

    it('re-keys features with source-local ids to avoid cross-sub-layer id collisions', () => {
        const mapgl = createMockMapgl({
            existingSourceId: getOverlaySourceId('group-1'),
        })
        const map = createMockMap(mapgl)

        // Two features from different sub-layers happen to share id=1
        const boundaryFeature = { id: 1, type: 'Feature', properties: {} }
        const bubbleFeature = { id: 1, type: 'Feature', properties: {} }

        updateHighlightOverlay(map, {
            id: 'group-1',
            features: [boundaryFeature, bubbleFeature],
            color: '#FFC800',
        })

        const source = mapgl.getSource(getOverlaySourceId('group-1'))
        const written = source.setData.mock.calls[0][0].features

        expect(written.map(f => f.id)).toEqual([1, 2])
        expect(mapgl.setFeatureState).toHaveBeenCalledTimes(2)
    })

    it('no-ops when the overlay source does not exist yet', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)

        expect(() =>
            updateHighlightOverlay(map, {
                id: 'missing',
                features: [],
                color: '#FFC800',
            })
        ).not.toThrow()
        expect(mapgl.setFeatureState).not.toHaveBeenCalled()
    })

    it('removes overlay layers and source', () => {
        const mapgl = createMockMapgl({
            existingSourceId: getOverlaySourceId('layer-1'),
            existingLayerId: 'layer-1-point-highlight',
        })
        const map = createMockMap(mapgl)

        removeHighlightOverlay(map, 'layer-1', ['layer-1-point-highlight'])

        expect(mapgl.removeLayer).toHaveBeenCalledWith(
            'layer-1-point-highlight'
        )
        expect(mapgl.removeSource).toHaveBeenCalledWith(
            getOverlaySourceId('layer-1')
        )
    })
})
