import Map from '../Map'

jest.mock('mapbox-gl', () => ({
    Map: ({ container }) => ({
        container,
        on: jest.fn(),
    }),
    Evented: () => {},
    Marker: () => {},
    Popup: () => {},
    FullscreenControl: () => {},
}))

describe('DHIS2 Maps-gl Map', () => {
    it('should initialize correctly', () => {
        const map = new Map('el')
        expect(map.getMapGL().on).toHaveBeenCalledTimes(4)
        expect(map.getMapGL().container).toBe('el')
    })
})
