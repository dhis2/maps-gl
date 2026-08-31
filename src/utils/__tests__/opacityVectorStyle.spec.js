import {
    setVectorStyleOpacity,
    clearVectorStyleOpacityCache,
} from '../opacityVectorStyle.js'

const createMapGL = (paint = {}) => ({
    getPaintProperty: jest.fn((id, property) => paint[id]?.[property]),
    setPaintProperty: jest.fn(),
})

describe('opacityVectorStyle', () => {
    it('scales plain numeric opacity values by the given factor', () => {
        const mapgl = createMapGL({ water: { 'fill-opacity': 0.8 } })
        const layers = [{ id: 'water', type: 'fill' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'water',
            'fill-opacity',
            0.4
        )
    })

    it('defaults to a base value of 1 when the style has no explicit value', () => {
        const mapgl = createMapGL()
        const layers = [{ id: 'roads', type: 'line' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'roads',
            'line-opacity',
            0.5
        )
    })

    it('scales the output values of a zoom-based interpolate expression in place', () => {
        const expression = ['interpolate', ['linear'], ['zoom'], 5, 0, 10, 1]
        const mapgl = createMapGL({ roads: { 'line-opacity': expression } })
        const layers = [{ id: 'roads', type: 'line' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'roads',
            'line-opacity',
            ['interpolate', ['linear'], ['zoom'], 5, 0, 10, 0.5]
        )
    })

    it('scales the output values of a zoom-based step expression in place', () => {
        const expression = ['step', ['zoom'], 0, 10, 1]
        const mapgl = createMapGL({ roads: { 'line-opacity': expression } })
        const layers = [{ id: 'roads', type: 'line' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'roads',
            'line-opacity',
            ['step', ['zoom'], 0, 10, 0.5]
        )
    })

    it('wraps a non-zoom-curve expression instead of overwriting it', () => {
        const expression = ['case', ['has', 'opacity'], ['get', 'opacity'], 1]
        const mapgl = createMapGL({ roads: { 'line-opacity': expression } })
        const layers = [{ id: 'roads', type: 'line' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'roads',
            'line-opacity',
            ['*', expression, 0.5]
        )
    })

    it('leaves legacy stops/function opacity values untouched', () => {
        const legacyFunction = {
            stops: [
                [0, 0],
                [10, 1],
            ],
        }
        const mapgl = createMapGL({ roads: { 'line-opacity': legacyFunction } })
        const layers = [{ id: 'roads', type: 'line' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'roads',
            'line-opacity',
            legacyFunction
        )
    })

    it('applies opacity across every supported layer type', () => {
        const mapgl = createMapGL()
        const layers = [
            { id: 'bg', type: 'background' },
            { id: 'water', type: 'fill' },
            { id: 'roads', type: 'line' },
            { id: 'poi', type: 'circle' },
            { id: 'labels', type: 'symbol' },
            { id: 'imagery', type: 'raster' },
            { id: 'buildings', type: 'fill-extrusion' },
            { id: 'density', type: 'heatmap' },
        ]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'bg',
            'background-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'water',
            'fill-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'roads',
            'line-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'poi',
            'circle-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'poi',
            'circle-stroke-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'labels',
            'icon-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'labels',
            'text-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'imagery',
            'raster-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'buildings',
            'fill-extrusion-opacity',
            0.5
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'density',
            'heatmap-opacity',
            0.5
        )
    })

    it('skips layer types with no opacity paint property', () => {
        const mapgl = createMapGL()
        const layers = [{ id: 'hills', type: 'hillshade' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.setPaintProperty).not.toHaveBeenCalled()
    })

    it('only applies opacity to the layers it is given', () => {
        const mapgl = createMapGL()
        const layers = [{ id: 'water', type: 'fill' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.setPaintProperty).toHaveBeenCalledTimes(1)
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'water',
            'fill-opacity',
            0.5
        )
    })

    it('reuses the cached base value instead of re-reading it every call', () => {
        const mapgl = createMapGL({ water: { 'fill-opacity': 0.8 } })
        const layers = [{ id: 'water', type: 'fill' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })
        setVectorStyleOpacity(mapgl, layers, { opacity: 1 })

        expect(mapgl.getPaintProperty).toHaveBeenCalledTimes(1)
        expect(mapgl.setPaintProperty).toHaveBeenLastCalledWith(
            'water',
            'fill-opacity',
            0.8
        )
    })

    it('re-reads base values again after the cache is cleared', () => {
        const mapgl = createMapGL({ water: { 'fill-opacity': 0.8 } })
        const layers = [{ id: 'water', type: 'fill' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })
        clearVectorStyleOpacityCache(mapgl)
        setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })

        expect(mapgl.getPaintProperty).toHaveBeenCalledTimes(2)
    })

    it('dims a symbol layer by labelOpacity even at the default opacity', () => {
        const mapgl = createMapGL({ labels: { 'text-opacity': 1 } })
        const layers = [{ id: 'labels', type: 'symbol' }]

        setVectorStyleOpacity(mapgl, layers, { opacity: 1, labelOpacity: 0.9 })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'labels',
            'text-opacity',
            0.9
        )
        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'labels',
            'icon-opacity',
            0.9
        )
    })

    it('composes labelOpacity with the basemap opacity, rather than one replacing the other', () => {
        const mapgl = createMapGL({ labels: { 'text-opacity': 1 } })
        const layers = [{ id: 'labels', type: 'symbol' }]

        setVectorStyleOpacity(mapgl, layers, {
            opacity: 0.5,
            labelOpacity: 0.9,
        })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'labels',
            'text-opacity',
            0.45
        )
    })

    it('does not apply labelOpacity to non-symbol layers', () => {
        const mapgl = createMapGL({ water: { 'fill-opacity': 1 } })
        const layers = [{ id: 'water', type: 'fill' }]

        setVectorStyleOpacity(mapgl, layers, {
            opacity: 0.5,
            labelOpacity: 0.9,
        })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'water',
            'fill-opacity',
            0.5
        )
    })

    it('composes labelOpacity with a zoom-based interpolate, staying a valid top-level expression', () => {
        const expression = ['interpolate', ['linear'], ['zoom'], 5, 0, 10, 1]
        const mapgl = createMapGL({ labels: { 'text-opacity': expression } })
        const layers = [{ id: 'labels', type: 'symbol' }]

        setVectorStyleOpacity(mapgl, layers, {
            opacity: 0.5,
            labelOpacity: 0.9,
        })

        expect(mapgl.setPaintProperty).toHaveBeenCalledWith(
            'labels',
            'text-opacity',
            ['interpolate', ['linear'], ['zoom'], 5, 0, 10, 0.45]
        )
    })

    it('logs, rather than throwing, when setPaintProperty rejects a value', () => {
        const mapgl = createMapGL({ water: { 'fill-opacity': 0.8 } })
        const layers = [{ id: 'water', type: 'fill' }]
        const error = new Error('Unsupported value')
        mapgl.setPaintProperty.mockImplementation(() => {
            throw error
        })
        jest.spyOn(console, 'error').mockImplementation(() => {})

        expect(() =>
            setVectorStyleOpacity(mapgl, layers, { opacity: 0.5 })
        ).not.toThrow()
        expect(console.error).toHaveBeenCalledWith(error)

        console.error.mockRestore()
    })
})
