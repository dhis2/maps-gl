/* global mockMap, mockMapGL */
import { updateHighlightOverlay } from '../../utils/highlightOverlay.js'
import Layer from '../Layer.js'

jest.mock('../../utils/highlightOverlay.js')

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
    it('Should re-move the highlight overlay after its base layers when moved, so it stays on top', () => {
        const layer = new Layer()
        layer.addLayer({ id: 'layer-1' })
        layer.addTo(mockMap)
        layer._overlayLayerIds = ['layer-1-highlight']
        mockMap.getBeforeLayerId.mockReturnValue('before-id')
        mockMapGL.moveLayer.mockClear()

        layer.move()

        expect(mockMapGL.moveLayer).toHaveBeenCalledWith('layer-1', 'before-id')
        expect(mockMapGL.moveLayer).toHaveBeenCalledWith(
            'layer-1-highlight',
            'before-id'
        )
        // Overlay must be moved after the base layer
        const movedIds = mockMapGL.moveLayer.mock.calls.map(call => call[0])
        expect(movedIds.indexOf('layer-1-highlight')).toBeGreaterThan(
            movedIds.indexOf('layer-1')
        )
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
    it('Should update the highlight overlay on highlight(), not the base source', () => {
        const layer = new Layer({ data })
        const source = layer.getId()

        layer.addTo(mockMap)
        updateHighlightOverlay.mockClear() // addTo() flushes the (empty) overlay
        layer.highlight('fdc6uOvgoji')
        expect(updateHighlightOverlay).toHaveBeenCalledTimes(1)
        expect(updateHighlightOverlay.mock.calls[0][1].features).toMatchObject([
            { id: 2, source },
        ])

        layer.highlight(1)
        expect(updateHighlightOverlay).toHaveBeenCalledTimes(2)
        expect(updateHighlightOverlay.mock.calls[1][1].features).toMatchObject([
            { id: 1, source },
        ])

        layer.highlight('abc')
        expect(updateHighlightOverlay).toHaveBeenCalledTimes(3)
        expect(updateHighlightOverlay.mock.lastCall[1].features).toEqual([])

        // The overlay is the sole renderer of the highlighted look
        expect(mockMap.setHoverState).not.toHaveBeenCalled()
        expect(mockMap.setSelectedState).not.toHaveBeenCalled()
    })
    it('Should update the highlight overlay for multiple ids at once', () => {
        const layer = new Layer({ data })
        const source = layer.getId()

        layer.addTo(mockMap)
        updateHighlightOverlay.mockClear() // addTo() flushes the (empty) overlay
        layer.highlight(['O6uvpzGd5pu', 'fdc6uOvgoji'])

        expect(updateHighlightOverlay).toHaveBeenCalledTimes(1)
        expect(updateHighlightOverlay.mock.calls[0][1].features).toMatchObject([
            { id: 1, source },
            { id: 2, source },
        ])
    })
    it('Should clear the highlight overlay for an empty array or null', () => {
        const layer = new Layer({ data })

        layer.addTo(mockMap)
        layer.highlight([])
        expect(updateHighlightOverlay.mock.lastCall[1].features).toEqual([])

        layer.highlight(null)
        expect(updateHighlightOverlay.mock.lastCall[1].features).toEqual([])
    })
    it('Should update the highlight overlay with selected ids, keyed independently from hover', () => {
        const layer = new Layer({ data })
        const source = layer.getId()

        layer.addTo(mockMap)
        updateHighlightOverlay.mockClear() // addTo() flushes the (empty) overlay
        layer.select(['O6uvpzGd5pu', 'fdc6uOvgoji'])

        expect(updateHighlightOverlay).toHaveBeenCalledTimes(1)
        expect(updateHighlightOverlay.mock.calls[0][1].features).toMatchObject([
            { id: 1, source },
            { id: 2, source },
        ])
        expect(mockMap.setHoverState).not.toHaveBeenCalled()
        expect(mockMap.setSelectedState).not.toHaveBeenCalled()
    })
    it('Should clear selected ids from the overlay for an empty array or null', () => {
        const layer = new Layer({ data })

        layer.addTo(mockMap)
        layer.select([])
        expect(updateHighlightOverlay.mock.lastCall[1].features).toEqual([])

        layer.select(null)
        expect(updateHighlightOverlay.mock.lastCall[1].features).toEqual([])
    })
    it('Should forward a caller-chosen color to highlight()/select()', () => {
        const layer = new Layer({ data })

        layer.addTo(mockMap)
        layer.highlight('fdc6uOvgoji', '#FFC800')
        expect(updateHighlightOverlay.mock.lastCall[1].color).toBe('#FFC800')

        layer.select(['O6uvpzGd5pu'], '#FF0000')
        expect(updateHighlightOverlay.mock.lastCall[1].color).toBe('#FF0000')
    })
    it('Should combine hover and a persistent selection into one overlay update instead of one clobbering the other', () => {
        const layer = new Layer({ data })
        const source = layer.getId()

        layer.addTo(mockMap)
        layer.select(['O6uvpzGd5pu'])
        layer.highlight('fdc6uOvgoji')

        // The later highlight() call's overlay update includes both the
        // new hover id and the earlier selection, not just the hover id
        expect(updateHighlightOverlay.mock.lastCall[1].features).toMatchObject([
            { id: 2, source },
            { id: 1, source },
        ])
    })
    it('Should let the last highlight()/select() color win for the whole overlay, by design', () => {
        const layer = new Layer({ data })

        layer.addTo(mockMap)
        layer.select(['O6uvpzGd5pu'], 'red')
        layer.highlight('fdc6uOvgoji', 'blue')

        // Hover and selection share one highlight color by design
        // The later call's color applies to the whole overlay, including the earlier selection
        expect(updateHighlightOverlay.mock.lastCall[1].color).toBe('blue')
    })
    it('Should replay a pending highlight into the overlay once it is (re-)created, e.g. after a style reload', () => {
        const layer = new Layer({ data })
        const source = layer.getId()

        layer.addTo(mockMap)
        layer.highlight('fdc6uOvgoji', '#FFC800')
        updateHighlightOverlay.mockClear()

        // Simulate the overlay being torn down and recreated
        // The previously recorded hover id/color must be flushed into the freshly created overlay
        layer.addTo(mockMap)

        expect(updateHighlightOverlay).toHaveBeenCalledTimes(1)
        expect(updateHighlightOverlay.mock.calls[0][1]).toMatchObject({
            features: [{ id: 2, source }],
            color: '#FFC800',
        })
    })
    it('Should drop a hovered/selected id from the overlay once setVisibleIds() filters it out', () => {
        const layer = new Layer({ data })
        const source = layer.getId()

        layer.addTo(mockMap)
        layer.highlight(['O6uvpzGd5pu', 'fdc6uOvgoji'])
        updateHighlightOverlay.mockClear()

        layer.setVisibleIds(['fdc6uOvgoji'])

        expect(updateHighlightOverlay).toHaveBeenCalledTimes(1)
        expect(updateHighlightOverlay.mock.lastCall[1].features).toMatchObject([
            { id: 2, source },
        ])
    })
    it('Should leave the overlay untouched when setVisibleIds() clears the filter (nothing to drop)', () => {
        const layer = new Layer({ data })

        layer.addTo(mockMap)
        layer.highlight(['O6uvpzGd5pu'])
        updateHighlightOverlay.mockClear()

        layer.setVisibleIds(null)

        expect(updateHighlightOverlay).not.toHaveBeenCalled()
    })
    it('Should restrict rendered features to the given ids, ANDed with any existing static filter', () => {
        const layer = new Layer({ data })
        layer.addLayer({ id: 'layer-1', filter: ['==', '$type', 'Polygon'] })
        layer.addLayer({ id: 'layer-1-points' })

        layer.addTo(mockMap)
        layer.setVisibleIds(['O6uvpzGd5pu', 'fdc6uOvgoji'])

        expect(mockMapGL.setFilter).toHaveBeenCalledWith('layer-1', [
            'all',
            ['==', '$type', 'Polygon'],
            ['in', ['get', 'id'], ['literal', ['O6uvpzGd5pu', 'fdc6uOvgoji']]],
        ])
        expect(mockMapGL.setFilter).toHaveBeenCalledWith('layer-1-points', [
            'in',
            ['get', 'id'],
            ['literal', ['O6uvpzGd5pu', 'fdc6uOvgoji']],
        ])
    })
    it('Should restore the original static filter when shown ids is cleared', () => {
        const layer = new Layer({ data })
        layer.addLayer({ id: 'layer-1', filter: ['==', '$type', 'Polygon'] })
        layer.addLayer({ id: 'layer-1-points' })

        layer.addTo(mockMap)
        layer.setVisibleIds(null)

        expect(mockMapGL.setFilter).toHaveBeenCalledWith('layer-1', [
            '==',
            '$type',
            'Polygon',
        ])
        expect(mockMapGL.setFilter).toHaveBeenCalledWith('layer-1-points', null)
    })
    it('Should invalidate the map interactive-layer cache when visibility changes, so a re-shown layer stays clickable/hoverable', () => {
        const layer = new Layer()
        layer.addLayer({ id: 'layer-1' })
        layer.addTo(mockMap)
        // createHighlightOverlay is mocked here and returns undefined by default
        layer._overlayLayerIds = []
        mockMapGL.getLayer.mockReturnValue(true)

        layer.setVisibility(false)
        expect(mockMap.invalidateInteractiveLayerIds).toHaveBeenCalledTimes(1)

        layer.setVisibility(true)
        expect(mockMap.invalidateInteractiveLayerIds).toHaveBeenCalledTimes(2)
    })
    it('Should hide/show the highlight overlay along with its base layer, so a hidden layer has no leftover glow', () => {
        const layer = new Layer()
        layer.addLayer({ id: 'layer-1' })
        layer.addTo(mockMap)
        layer._overlayLayerIds = ['layer-1-highlight']
        mockMapGL.getLayer.mockReturnValue(true)
        mockMapGL.setLayoutProperty.mockClear()

        layer.setVisibility(false)

        expect(mockMapGL.setLayoutProperty).toHaveBeenCalledWith(
            'layer-1',
            'visibility',
            'none'
        )
        expect(mockMapGL.setLayoutProperty).toHaveBeenCalledWith(
            'layer-1-highlight',
            'visibility',
            'none'
        )
    })
    it('Should wire and unwire onMouseEnter/onMouseLeave callbacks', () => {
        const onMouseEnter = jest.fn()
        const onMouseLeave = jest.fn()
        const layer = new Layer({ onMouseEnter, onMouseLeave })

        layer.addTo(mockMap)
        layer.fire('mouseenter')
        layer.fire('mouseleave')
        expect(onMouseEnter).toHaveBeenCalledTimes(1)
        expect(onMouseLeave).toHaveBeenCalledTimes(1)

        layer.removeFrom(mockMap)
        layer.fire('mouseenter')
        layer.fire('mouseleave')
        expect(onMouseEnter).toHaveBeenCalledTimes(1)
        expect(onMouseLeave).toHaveBeenCalledTimes(1)
    })
    it('Should reset _overlayLayerIds on removal, so a stale id is never moved/toggled after re-adding', () => {
        const layer = new Layer()
        layer.addLayer({ id: 'layer-1' })
        layer.addTo(mockMap)
        layer._overlayLayerIds = ['layer-1-highlight']

        layer.removeFrom(mockMap)

        expect(layer._overlayLayerIds).toEqual([])
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
    it('Should not move layers while the style is loading', () => {
        const layer = new Layer()
        layer.addLayer({ id: 'x-polygon' })
        layer.addTo(mockMap)
        mockMapGL.getLayer.mockReturnValue(true)
        mockMap.styleIsLoaded.mockReturnValue(false)

        expect(() => layer.move()).not.toThrow()
        expect(mockMapGL.moveLayer).not.toHaveBeenCalled()
    })
    it('Should only move sub-layers that actually exist', () => {
        const layer = new Layer()
        layer.addLayer({ id: 'x-polygon' })
        layer.addLayer({ id: 'x-point' })
        layer.addTo(mockMap)
        mockMap.getBeforeLayerId.mockReturnValue('before-id')
        mockMapGL.getLayer.mockImplementation(id => id === 'x-polygon')

        layer.move()

        expect(mockMapGL.moveLayer).toHaveBeenCalledWith(
            'x-polygon',
            'before-id'
        )
        expect(mockMapGL.moveLayer).not.toHaveBeenCalledWith(
            'x-point',
            expect.anything()
        )
    })
})
