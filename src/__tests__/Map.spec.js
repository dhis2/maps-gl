import Map from '../Map'

jest.mock('mapbox-gl', () => ({
    Map: () => mockMapGL,
    Evented: () => {},
    Marker: () => {},
    Popup: () => {},
    NavigationControl: () => {},
    FullscreenControl: () => {},
}))

describe('DHIS2 Maps-gl Map', () => {
    it('should initialize correctly', () => {
        const map = new Map('el')
        const mapgl = map.getMapGL()

        expect(mapgl).not.toBe(undefined)
        expect(mapgl).toEqual(mockMapGL)
        expect(mapgl.on).toHaveBeenCalledTimes(5)
    })

    it('should set layer feature hover state', () => {
        const map = new Map('el')
        const mapgl = map.getMapGL()
        const getSourceMock = mapgl.getSource
        const setFeatureStateSpy = jest.spyOn(map, 'setFeatureState')
        const feature = { id: 1, source: 'abc' }

        mapgl.getSource.mockReturnValue(true)
        expect(map._hoverId).toBe(undefined)
        expect(map._hoverState).toBe(undefined)
        map.setHoverState(feature)
        expect(map._hoverId).toBe('1-abc')
        expect(map._hoverState).toBe(feature)
        expect(setFeatureStateSpy).toHaveBeenCalled()
        expect(setFeatureStateSpy).lastCalledWith(feature, { hover: true })
        expect(getSourceMock).toHaveBeenCalled()
        expect(mapgl.setFeatureState).lastCalledWith(feature, { hover: true })
        map.setHoverState(null)
        expect(map._hoverId).toBe(undefined)
        expect(map._hoverState).toBe(null)
        expect(setFeatureStateSpy).toHaveBeenCalledTimes(2)
        expect(setFeatureStateSpy).lastCalledWith(feature, { hover: false })
        expect(getSourceMock).toHaveBeenCalledTimes(2)
        expect(mapgl.setFeatureState).lastCalledWith(feature, { hover: false })
    })
})
