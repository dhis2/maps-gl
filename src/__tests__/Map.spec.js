import Map from '../Map'
import mapboxgl from 'mapbox-gl'

jest.mock('mapbox-gl', () => ({
    Map: ({ container }) => ({
        container,
        on: jest.fn(),
    }),
}))

describe('DHIS2 Maps-gl Map', () => {
    it('should initialize correctly', () => {
        const map = new Map('el')
        expect(map.getMapGL().on).toHaveBeenCalledTimes(3)
        expect(map.getMapGL().container).toBe('el')
    })
})
