import VectorStyle from '../VectorStyle.js'

const createMapGL = () => {
    const mapgl = {
        once: jest.fn((event, cb) => {
            if (event === 'idle') {
                Promise.resolve().then(cb)
            }
            return mapgl
        }),
        setStyle: jest.fn(() => mapgl),
        getStyle: jest.fn(),
        getPaintProperty: jest.fn(),
        setPaintProperty: jest.fn(),
        setLayoutProperty: jest.fn(),
    }
    return mapgl
}

const createMap = mapgl => ({
    getMapGL: () => mapgl,
    setBeforeLayerId: jest.fn(),
    getLayers: jest.fn(() => []),
})

describe('VectorStyle opacity', () => {
    it('does not throw when set before the layer is added to the map', () => {
        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })

        expect(() => vectorStyle.setOpacity(0.5)).not.toThrow()
        expect(vectorStyle.options.opacity).toBe(0.5)
    })

    it('ignores a non-numeric opacity', () => {
        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })

        expect(() => vectorStyle.setOpacity(undefined)).not.toThrow()
        expect(vectorStyle.options.opacity).toBeUndefined()
    })

    it('does not write to paint properties for a non-numeric opacity, even while on the map', async () => {
        const mapgl = createMapGL()
        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'water', type: 'fill' }],
        })
        mapgl.getPaintProperty.mockReturnValue(0.8)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })
        await vectorStyle.addTo(createMap(mapgl))

        vectorStyle.setOpacity(undefined)

        expect(mapgl.setPaintProperty).not.toHaveBeenCalled()
    })

    it('does not touch paint properties when added at the default opacity', async () => {
        const mapgl = createMapGL()
        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'water', type: 'fill' }],
        })
        mapgl.getPaintProperty.mockReturnValue(0.8)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })
        await vectorStyle.addTo(createMap(mapgl))

        expect(mapgl.setPaintProperty).not.toHaveBeenCalled()
    })

    it('applies an explicitly configured opacity once added to the map', async () => {
        const mapgl = createMapGL()
        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'water', type: 'fill' }],
        })
        mapgl.getPaintProperty.mockReturnValue(0.8)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
            opacity: 0.5,
        })
        await vectorStyle.addTo(createMap(mapgl))

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'water',
            'fill-opacity',
            0.4
        )
    })

    it('does not touch layers added after the vector style loaded (e.g. overlays)', async () => {
        const mapgl = createMapGL()
        const map = createMap(mapgl)

        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'water', type: 'fill' }],
        })
        mapgl.getPaintProperty.mockReturnValue(1)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })
        await vectorStyle.addTo(map)

        // An overlay layer added on top, sharing the same mapgl style
        mapgl.getStyle.mockReturnValue({
            layers: [
                { id: 'water', type: 'fill' },
                { id: 'thematic-polygon', type: 'fill' },
            ],
        })

        vectorStyle.setOpacity(0.5)

        expect(mapgl.setPaintProperty).not.toHaveBeenCalledWith(
            'thematic-polygon',
            'fill-opacity',
            expect.anything()
        )
    })

    it('scales opacity when changed after being added to the map', async () => {
        const mapgl = createMapGL()
        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'water', type: 'fill' }],
        })
        mapgl.getPaintProperty.mockReturnValue(0.8)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })
        await vectorStyle.addTo(createMap(mapgl))
        mapgl.setPaintProperty.mockClear()

        vectorStyle.setOpacity(0.5)

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'water',
            'fill-opacity',
            0.4
        )
    })

    it('restores full opacity', async () => {
        const mapgl = createMapGL()
        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'water', type: 'fill' }],
        })
        mapgl.getPaintProperty.mockReturnValue(0.8)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })
        await vectorStyle.addTo(createMap(mapgl))

        vectorStyle.setOpacity(0.5)
        mapgl.setPaintProperty.mockClear()
        vectorStyle.setOpacity(1)

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'water',
            'fill-opacity',
            0.8
        )
    })

    it('re-applies the current opacity to a newly loaded style, using its own base values', async () => {
        const mapgl = createMapGL()
        const map = createMap(mapgl)

        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'water', type: 'fill' }],
        })
        mapgl.getPaintProperty.mockReturnValue(1)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/light.json',
        })
        await vectorStyle.addTo(map)
        vectorStyle.setOpacity(0.5)
        mapgl.setPaintProperty.mockClear()

        // Switch to a different style with a layer of its own base opacity
        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'ocean', type: 'fill' }],
        })
        mapgl.getPaintProperty.mockReturnValue(0.6)

        await vectorStyle.toggleVectorStyle(
            true,
            'https://example.com/dark.json'
        )

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'ocean',
            'fill-opacity',
            0.3
        )
    })

    it('does not apply opacity while the layer is being removed from the map', async () => {
        const mapgl = createMapGL()
        const map = createMap(mapgl)

        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'water', type: 'fill' }],
        })
        mapgl.getPaintProperty.mockReturnValue(1)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })
        await vectorStyle.addTo(map)

        await vectorStyle.removeFrom()

        expect(vectorStyle.isOnMap()).toBe(false)
    })
})
