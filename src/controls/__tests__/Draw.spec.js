import Draw, { DRAW_TYPE_LINE, DRAW_TYPE_POINT } from '../Draw.js'

const createMap = () => {
    const handlers = {}
    const source = { setData: jest.fn() }
    const mapgl = {
        on: jest.fn((type, fn) => (handlers[type] = fn)),
        off: jest.fn(),
        once: jest.fn(),
        isStyleLoaded: () => true,
        addSource: jest.fn(),
        addLayer: jest.fn(),
        getLayer: jest.fn(() => true),
        removeLayer: jest.fn(),
        getSource: jest.fn(() => source),
        removeSource: jest.fn(),
        moveLayer: jest.fn(),
        queryRenderedFeatures: jest.fn(() => []),
        dragPan: { enable: jest.fn(), disable: jest.fn() },
        getCanvas: () => ({ style: {} }),
        getContainer: () => document.body,
        doubleClickZoom: {
            isEnabled: () => true,
            enable: jest.fn(),
            disable: jest.fn(),
        },
        _getUIString: key => key,
    }
    const map = { getMapGL: () => mapgl, on: jest.fn(), off: jest.fn() }
    return { map, mapgl, handlers }
}

// Next queryRenderedFeatures result, to hit a vertex or midpoint handle
const hitHandle = (mapgl, kind, index) =>
    mapgl.queryRenderedFeatures.mockReturnValueOnce([
        { properties: { kind, index } },
    ])

const line = {
    type: 'LineString',
    coordinates: [
        [0, 0],
        [2, 2],
        [4, 4],
    ],
}

const mouse = (lng, lat) => ({
    lngLat: { lng, lat },
    point: {},
    preventDefault: jest.fn(),
})

const click = (handlers, lng, lat) => handlers.click({ lngLat: { lng, lat } })

describe('Draw', () => {
    it('draws a line from the start point and finishes on double-click', () => {
        const { map, mapgl, handlers } = createMap()
        const onFinish = jest.fn()
        const draw = new Draw(map, {
            type: DRAW_TYPE_LINE,
            start: [0, 0],
            onFinish,
        })
        draw.start()

        expect(mapgl.doubleClickZoom.disable).toHaveBeenCalled()

        click(handlers, 1, 1)
        // A double-click fires two clicks at the same place
        click(handlers, 2, 2)
        click(handlers, 2, 2)
        handlers.dblclick({ preventDefault: jest.fn() })

        expect(onFinish).toHaveBeenCalledWith({
            type: 'LineString',
            coordinates: [
                [0, 0],
                [1, 1],
                [2, 2],
            ],
        })
        expect(mapgl.removeSource).toHaveBeenCalledWith('draw')
        expect(mapgl.doubleClickZoom.enable).toHaveBeenCalled()
        expect(document.querySelector('.dhis2-map-ctrl-measure-result')).toBe(
            null
        )
    })

    it('does not finish a line with less than 2 vertices', () => {
        const { map } = createMap()
        const onFinish = jest.fn()
        const draw = new Draw(map, { type: DRAW_TYPE_LINE, onFinish })
        draw.start()
        draw.finish()

        expect(onFinish).not.toHaveBeenCalled()
        draw.remove()
    })

    it('returns a point on the first click', () => {
        const { map, handlers } = createMap()
        const onFinish = jest.fn()
        new Draw(map, { type: DRAW_TYPE_POINT, onFinish }).start()

        click(handlers, 3, 4)

        expect(onFinish).toHaveBeenCalledWith({
            type: 'Point',
            coordinates: [3, 4],
        })
    })

    it('cancels on Escape', () => {
        const { map } = createMap()
        const onCancel = jest.fn()
        new Draw(map, { onCancel }).start()

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

        expect(onCancel).toHaveBeenCalled()
    })

    it('shows a guide segment to the mouse position', () => {
        const { map, handlers } = createMap()
        const draw = new Draw(map, { start: [0, 0] })
        draw.start()

        handlers.mousemove({ lngLat: { lng: 5, lat: 5 } })

        const guide = draw
            .getData()
            .features.find(f => f.properties.kind === 'guide')
        expect(guide.geometry.coordinates).toEqual([
            [0, 0],
            [5, 5],
        ])
        draw.remove()
    })

    it('drags a vertex of an existing line', () => {
        const { map, mapgl, handlers } = createMap()
        const onFinish = jest.fn()
        const draw = new Draw(map, { geometry: line, onFinish })
        draw.start()

        hitHandle(mapgl, 'vertex', 1)
        handlers.mousedown(mouse(2, 2))
        expect(mapgl.dragPan.disable).toHaveBeenCalled()
        handlers.mousemove(mouse(3, 1))
        handlers.mouseup()
        // The click after a drag is ignored
        handlers.click(mouse(3, 1))
        expect(mapgl.dragPan.enable).toHaveBeenCalled()

        draw.finish()
        expect(onFinish).toHaveBeenCalledWith({
            type: 'LineString',
            coordinates: [
                [0, 0],
                [3, 1],
                [4, 4],
            ],
        })
    })

    it('inserts a vertex by dragging a midpoint', () => {
        const { map, mapgl, handlers } = createMap()
        const onFinish = jest.fn()
        const draw = new Draw(map, { geometry: line, onFinish })
        draw.start()

        const midpoints = draw
            .getData()
            .features.filter(f => f.properties.kind === 'midpoint')
        expect(midpoints.map(f => f.geometry.coordinates)).toEqual([
            [1, 1],
            [3, 3],
        ])

        hitHandle(mapgl, 'midpoint', 1)
        handlers.mousedown(mouse(1, 1))
        handlers.mousemove(mouse(0, 2))
        handlers.mouseup()
        handlers.click(mouse(0, 2))

        draw.finish()
        expect(onFinish.mock.calls[0][0].coordinates).toEqual([
            [0, 0],
            [0, 2],
            [2, 2],
            [4, 4],
        ])
    })

    it('removes a clicked vertex, keeping at least 2', () => {
        const { map, mapgl, handlers } = createMap()
        const onFinish = jest.fn()
        const draw = new Draw(map, { geometry: line, onFinish })
        draw.start()

        hitHandle(mapgl, 'vertex', 1)
        handlers.click(mouse(2, 2))
        hitHandle(mapgl, 'vertex', 0)
        handlers.click(mouse(0, 0))

        draw.finish()
        expect(onFinish.mock.calls[0][0].coordinates).toEqual([
            [0, 0],
            [4, 4],
        ])
    })

    it('does not finish on double-click while editing', () => {
        const { map, handlers } = createMap()
        const onFinish = jest.fn()
        new Draw(map, { geometry: line, onFinish }).start()

        handlers.click(mouse(5, 5))
        handlers.click(mouse(5, 5))
        handlers.dblclick(mouse(5, 5))

        expect(onFinish).not.toHaveBeenCalled()
    })

    it('moves an existing point to a clicked position', () => {
        const { map, handlers } = createMap()
        const onFinish = jest.fn()
        const draw = new Draw(map, {
            type: DRAW_TYPE_POINT,
            geometry: { type: 'Point', coordinates: [1, 1] },
            onFinish,
        })
        draw.start()

        handlers.click(mouse(6, 7))
        expect(onFinish).not.toHaveBeenCalled()

        draw.finish()
        expect(onFinish).toHaveBeenCalledWith({
            type: 'Point',
            coordinates: [6, 7],
        })
    })
})
