import {
    getOverlaySourceId,
    createHighlightOverlay,
    updateHighlightOverlay,
    removeHighlightOverlay,
} from '../highlightOverlay.js'

const createMockMapgl = ({ existingSourceId, existingLayerId } = {}) => {
    // getSource(id) must return the same instance every call, like real maplibre-gl.
    const sources = new Map()
    const createSource = id =>
        sources.set(id, { setData: jest.fn(), updateData: jest.fn() })

    if (existingSourceId) {
        createSource(existingSourceId)
    }

    return {
        addSource: jest.fn(createSource),
        addLayer: jest.fn(),
        removeLayer: jest.fn(),
        removeSource: jest.fn(),
        setPaintProperty: jest.fn(),
        getSource: jest.fn(id => sources.get(id)),
        getLayer: jest.fn(id => id === existingLayerId),
    }
}

const feature = id => ({ id, type: 'Feature', properties: {} })

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

    it('empties an existing source instead of adding it again, since its features are no longer tracked', () => {
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
        expect(
            mapgl.getSource(getOverlaySourceId('layer-1')).setData
        ).toHaveBeenCalledWith({ type: 'FeatureCollection', features: [] })
    })

    it('draws the hovered look in the clones, so overlay features need no feature-state', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)
        const isHover = ['boolean', ['feature-state', 'hover'], false]

        createHighlightOverlay(map, {
            id: 'layer-1',
            glLayers: [
                {
                    id: 'layer-1-point',
                    type: 'circle',
                    paint: { 'circle-stroke-width': ['case', isHover, 3, 1] },
                },
            ],
            beforeId: undefined,
        })

        expect(mapgl.addLayer.mock.calls[0][0].paint).toEqual({
            'circle-stroke-width': ['case', ['boolean', true, false], 3, 1],
        })
    })

    it('adds features with their own ids through updateData', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)
        createHighlightOverlay(map, { id: 'layer-1', glLayers: [] })
        const source = mapgl.getSource(getOverlaySourceId('layer-1'))

        updateHighlightOverlay(map, { id: 'layer-1', features: [feature(7)] })

        expect(source.updateData).toHaveBeenCalledWith({
            add: [feature(7)],
            remove: [],
        })
        expect(source.setData).not.toHaveBeenCalled()
    })

    it('sends only the features added or removed since the last update', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)
        createHighlightOverlay(map, { id: 'layer-1', glLayers: [] })
        const source = mapgl.getSource(getOverlaySourceId('layer-1'))

        updateHighlightOverlay(map, {
            id: 'layer-1',
            features: [feature(1), feature(2)],
        })
        updateHighlightOverlay(map, {
            id: 'layer-1',
            features: [feature(2), feature(3)],
        })

        expect(source.updateData).toHaveBeenLastCalledWith({
            add: [feature(3)],
            remove: [1],
        })
    })

    it('sends nothing when the features and color are unchanged', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)
        createHighlightOverlay(map, {
            id: 'layer-1',
            glLayers: [{ id: 'layer-1-line', type: 'line', paint: {} }],
        })
        const source = mapgl.getSource(getOverlaySourceId('layer-1'))
        const update = {
            id: 'layer-1',
            features: [feature(1)],
            color: '#FFC800',
        }

        updateHighlightOverlay(map, update)
        updateHighlightOverlay(map, update)

        expect(source.updateData).toHaveBeenCalledTimes(1)
        expect(mapgl.setPaintProperty).toHaveBeenCalledTimes(1)
    })

    it('applies the highlight color to every clone, and restores their own color when it is cleared', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)
        createHighlightOverlay(map, {
            id: 'layer-1',
            glLayers: [
                {
                    id: 'layer-1-point',
                    type: 'circle',
                    paint: { 'circle-stroke-color': '#333333' },
                },
                {
                    id: 'layer-1-line',
                    type: 'line',
                    paint: { 'line-color': ['get', 'color'] },
                },
                {
                    id: 'layer-1-symbol',
                    type: 'symbol',
                    layout: { 'icon-image': ['get', 'iconUrl'] },
                },
            ],
        })

        updateHighlightOverlay(map, {
            id: 'layer-1',
            features: [],
            color: '#FFC800',
        })

        expect(mapgl.setPaintProperty.mock.calls).toEqual([
            ['layer-1-point-highlight', 'circle-stroke-color', '#FFC800'],
            ['layer-1-line-highlight', 'line-color', '#FFC800'],
            ['layer-1-symbol-highlight-halo', 'circle-color', '#FFC800'],
        ])

        mapgl.setPaintProperty.mockClear()
        updateHighlightOverlay(map, { id: 'layer-1', features: [] })

        expect(mapgl.setPaintProperty.mock.calls).toEqual([
            ['layer-1-point-highlight', 'circle-stroke-color', '#333333'],
            ['layer-1-line-highlight', 'line-color', ['get', 'color']],
            ['layer-1-symbol-highlight-halo', 'circle-color', '#333333'],
        ])
    })

    it('no-ops when the overlay source does not exist yet', () => {
        const mapgl = createMockMapgl()
        const map = createMockMap(mapgl)

        expect(() =>
            updateHighlightOverlay(map, {
                id: 'missing',
                features: [feature(1)],
                color: '#FFC800',
            })
        ).not.toThrow()
        expect(mapgl.setPaintProperty).not.toHaveBeenCalled()
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
