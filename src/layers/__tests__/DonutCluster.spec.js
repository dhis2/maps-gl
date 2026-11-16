/* global mockMap, mockMapGL */
import DonutCluster from '../DonutCluster.js'

jest.mock('../../utils/highlightOverlay.js')

const data = [
    {
        type: 'Feature',
        properties: { id: 'a', colorGroup: 0 },
        geometry: { type: 'Point', coordinates: [0, 0] },
    },
    {
        type: 'Feature',
        properties: { id: 'b', colorGroup: 0 },
        geometry: { type: 'Point', coordinates: [1, 1] },
    },
]

describe('DonutCluster', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        mockMapGL.getStyle.mockReturnValue({ layers: [] })
        mockMapGL.querySourceFeatures = jest.fn(() => [])
    })

    it('Should drop its markers when setVisibleIds() re-sends the data, since cluster ids then pass to other clusters', () => {
        const cluster = new DonutCluster({ data, groups: [{ color: '#f00' }] })
        mockMapGL.getSource.mockReturnValue({ setData: jest.fn() })
        cluster.addTo(mockMap)

        const marker = { remove: jest.fn() }
        cluster.clusters = { 34: marker }
        cluster.clustersOnScreen = { 34: marker }

        cluster.setVisibleIds(['b'])

        expect(marker.remove).toHaveBeenCalled()
        expect(cluster.clusters).toEqual({})
        expect(cluster.clustersOnScreen).toEqual({})
    })
})
