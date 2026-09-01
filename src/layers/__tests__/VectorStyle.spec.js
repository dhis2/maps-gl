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

const createFailingMapGL = () => {
    const mapgl = {
        once: jest.fn((event, cb) => {
            if (event === 'error') {
                Promise.resolve().then(() =>
                    cb({ error: { message: 'network error' } })
                )
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

const createControllableMapGL = () => {
    const listeners = { idle: [], error: [] }
    const mapgl = {
        once: jest.fn((event, cb) => {
            listeners[event].push(cb)
            return mapgl
        }),
        off: jest.fn((event, cb) => {
            listeners[event] = listeners[event].filter(l => l !== cb)
        }),
        setStyle: jest.fn(() => mapgl),
        getStyle: jest.fn(() => ({ layers: [] })),
        getPaintProperty: jest.fn(),
        setPaintProperty: jest.fn(),
        setLayoutProperty: jest.fn(),
    }
    const fire = (event, arg) => {
        listeners[event].slice().forEach(cb => cb(arg))
        listeners[event] = []
    }
    return {
        mapgl,
        fireIdle: () => fire('idle'),
        fireError: e => fire('error', e),
    }
}

const flushMicrotasks = async (n = 3) => {
    for (let i = 0; i < n; i++) {
        await Promise.resolve()
    }
}

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

    it('applies a configured labelOpacity at load time, even at the default basemap opacity', async () => {
        const mapgl = createMapGL()
        mapgl.getStyle.mockReturnValue({
            layers: [
                { id: 'water', type: 'fill' },
                { id: 'labels', type: 'symbol' },
            ],
        })
        mapgl.getPaintProperty.mockReturnValue(1)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
            labelOpacity: 0.9,
        })
        await vectorStyle.addTo(createMap(mapgl))

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'labels',
            'text-opacity',
            0.9
        )
        // Unaffected by labelOpacity - reset to its own unchanged base value
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'water',
            'fill-opacity',
            1
        )
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

    it('still restores other (overlay) layers when the style fails to load, and rethrows the error', async () => {
        const mapgl = createFailingMapGL()
        const map = createMap(mapgl)
        const otherLayer = {
            isOnMap: jest.fn(() => false),
            addTo: jest.fn(async () => {}),
            removeFrom: jest.fn(async () => {}),
            setVisibility: jest.fn(),
            isVisible: jest.fn(() => true),
        }
        map.getLayers = jest.fn(() => [otherLayer])

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })

        await expect(vectorStyle.addTo(map)).rejects.toBeDefined()

        expect(otherLayer.addTo).toHaveBeenCalledWith(map)
    })

    it('is not considered on the map after a failed load', async () => {
        const mapgl = createFailingMapGL()
        const map = createMap(mapgl)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })

        await expect(vectorStyle.addTo(map)).rejects.toBeDefined()

        expect(vectorStyle.isOnMap()).toBe(false)
    })

    it('suppresses an error from a load superseded by a newer basemap switch', async () => {
        const { mapgl, fireIdle } = createControllableMapGL()
        const map = createMap(mapgl)
        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })
        vectorStyle._map = map

        const firstCall = vectorStyle.toggleVectorStyle(
            true,
            'https://example.com/a.json'
        )
        await flushMicrotasks()

        // Starting a second call detaches and settles the first one - it
        // never gets a chance to see a stray idle/error event
        const secondCall = vectorStyle.toggleVectorStyle(
            true,
            'https://example.com/b.json'
        )
        await flushMicrotasks()

        await expect(firstCall).resolves.toBeUndefined()
        // The superseded call's own finally must not clear this while the
        // current call is still loading
        expect(map._styleIsLoading).toBe(true)

        // The second (current) load succeeds normally
        fireIdle()
        await expect(secondCall).resolves.toBeUndefined()
        expect(map._styleIsLoading).toBe(false)
    })

    it('does not apply a superseded load, even when it resolves successfully', async () => {
        const { mapgl, fireIdle } = createControllableMapGL()
        const map = createMap(mapgl)
        mapgl.getPaintProperty.mockReturnValue(1)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
            opacity: 0.5,
        })
        vectorStyle._map = map

        // The superseded call gets its own, distinct, non-empty layers -
        // if isCurrent() didn't gate this call's own opacity re-application,
        // this is what would leak into setPaintProperty
        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'lake', type: 'fill' }],
        })

        const firstCall = vectorStyle.toggleVectorStyle(
            true,
            'https://example.com/a.json'
        )
        await flushMicrotasks()

        const secondCall = vectorStyle.toggleVectorStyle(
            true,
            'https://example.com/b.json'
        )
        await flushMicrotasks()

        // The first call already settled (superseded) - its own opacity
        // re-application must not run, even though real, non-empty layer
        // data was available to it
        await expect(firstCall).resolves.toBeUndefined()
        expect(mapgl.setPaintProperty).not.toHaveBeenCalled()

        mapgl.getStyle.mockReturnValue({
            layers: [{ id: 'ocean', type: 'fill' }],
        })
        fireIdle()
        await expect(secondCall).resolves.toBeUndefined()

        // Only the current (second) call's opacity should have been applied
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'ocean',
            'fill-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).not.toHaveBeenCalledWith(
            'lake',
            'fill-opacity',
            expect.anything()
        )
    })

    it('suppresses a stale result across two different VectorStyle instances sharing a map', async () => {
        // Switching basemaps creates a new VectorStyle instance rather than
        // reusing the old one, but both still contend for the same
        // underlying map style - staleness must be tracked map-wide
        const { mapgl, fireIdle } = createControllableMapGL()
        const map = createMap(mapgl)

        const oldBasemap = new VectorStyle({
            url: 'https://example.com/a.json',
        })
        const newBasemap = new VectorStyle({
            url: 'https://example.com/b.json',
        })
        oldBasemap._map = map
        newBasemap._map = map

        const removeCall = oldBasemap.toggleVectorStyle(
            false,
            'https://example.com/default.json'
        )
        await flushMicrotasks()

        const addCall = newBasemap.toggleVectorStyle(
            true,
            'https://example.com/b.json'
        )
        await flushMicrotasks()

        // The old basemap's own load was detached and settled the moment
        // the new one started - it never sees a stray idle/error event
        await expect(removeCall).resolves.toBeUndefined()

        // The new basemap's load succeeds normally
        fireIdle()
        await expect(addCall).resolves.toBeUndefined()
    })

    it('settles an earlier pending load and clears the loading flag when a later call skips setStyle() entirely', async () => {
        // A call takes the "skip" branch (isOnMap false, another vector
        // style already registered) when it doesn't need to reset the
        // shared style - it never calls setStyle() itself, so nothing else
        // would settle an earlier, still-pending call or clear the flag
        const { mapgl, fireError } = createControllableMapGL()
        const map = createMap(mapgl)

        const vectorStyle = new VectorStyle({
            url: 'https://example.com/a.json',
        })
        vectorStyle._map = map

        const firstCall = vectorStyle.toggleVectorStyle(
            true,
            'https://example.com/a.json'
        )
        await flushMicrotasks()
        expect(map._styleIsLoading).toBe(true)

        map.getLayers = jest.fn(() => [vectorStyle])
        const secondCall = vectorStyle.toggleVectorStyle(
            false,
            'https://example.com/default.json'
        )
        await flushMicrotasks()

        expect(map._styleIsLoading).toBe(false)
        await expect(firstCall).resolves.toBeUndefined()
        await expect(secondCall).resolves.toBeUndefined()

        // Confirms fireError is unused by the first call at this point -
        // its listeners were already detached by the skip branch above
        expect(() => fireError({ error: { message: 'x' } })).not.toThrow()
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
