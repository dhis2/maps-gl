import Map from '../Map'

jest.mock('mapbox-gl', () => ({
    Map: ({ container }) => ({
        container,
        on: jest.fn(),
        addControl: jest.fn(),
    }),
    Evented: () => {},
    Marker: () => {},
    Popup: () => {},
    NavigationControl: () => {},
    FullscreenControl: () => {},
}))

describe('DHIS2 Maps-gl Map', () => {
    it('should initialize correctly', () => {
        const map = new Map('el')
        expect(map.getMapGL().on).toHaveBeenCalledTimes(5)
        expect(map.getMapGL().container).toBe('el')
    })
})
