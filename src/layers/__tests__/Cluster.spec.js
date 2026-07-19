/* global mockMap, mockMapGL */
import { isClusterPoint } from '../../utils/filters.js'
import { updateHighlightOverlay } from '../../utils/highlightOverlay.js'
import Cluster from '../Cluster.js'

jest.mock('../../utils/highlightOverlay.js')

const findLabelLayer = cluster =>
    cluster.getLayers().find(layer => layer.id === `${cluster.getId()}-label`)

const data = [
    {
        type: 'Feature',
        properties: { id: 'a' },
        geometry: { type: 'Point', coordinates: [0, 0] },
    },
    {
        type: 'Feature',
        properties: { id: 'b' },
        geometry: { type: 'Point', coordinates: [1, 1] },
    },
]

describe('Cluster', () => {
    it('Should not add a label layer when label is not set', () => {
        const cluster = new Cluster({})

        expect(findLabelLayer(cluster)).toBeUndefined()
    })

    it('Should add a label layer reading from the point source', () => {
        const cluster = new Cluster({ label: '{name}' })
        const layer = findLabelLayer(cluster)

        expect(layer).toBeDefined()
        expect(layer.source).toBe(cluster.getId())
        expect(layer.filter).toEqual(isClusterPoint)
    })

    it('Should apply labelStyle to the label layer', () => {
        const cluster = new Cluster({
            label: '{name}',
            labelStyle: { fontSize: 14, color: '#fff' },
        })
        const layer = findLabelLayer(cluster)

        expect(layer.layout['text-size']).toBe(14)
        expect(layer.paint['text-color']).toBe('#fff')
    })

    it('Should not let labelStyle override id, label or radius', () => {
        const cluster = new Cluster({
            label: '{name}',
            radius: 5,
            labelStyle: { radius: 999, label: 'nope' },
        })
        const layer = findLabelLayer(cluster)

        expect(layer.layout['text-field']).toEqual([
            'case',
            ['has', 'name'],
            ['get', 'name'],
            '',
        ])
        // offset = radius / fontSize + 0.4, using the explicit radius (5),
        // not the one smuggled in via labelStyle (999)
        expect(layer.layout['text-offset'][1]).toBeCloseTo(5 / 12 + 0.4)
    })

    describe('setVisibleIds', () => {
        beforeEach(() => {
            jest.resetAllMocks()
            // addTo() below triggers onAdd(), which always calls setOpacity();
            // that reads the map style, so it must be stubbed even though this
            // test isn't about opacity.
            mockMapGL.getStyle.mockReturnValue({ layers: [] })
        })

        it('Should re-send only the matching features as the source data, so clustering recomputes from just the visible subset', () => {
            const cluster = new Cluster({ data })
            const source = { setData: jest.fn() }
            mockMapGL.getSource.mockReturnValue(source)

            cluster.addTo(mockMap)
            cluster.setVisibleIds(['b'])

            expect(source.setData).toHaveBeenCalledWith({
                type: 'FeatureCollection',
                features: [
                    expect.objectContaining({ properties: { id: 'b' } }),
                ],
            })
        })

        it('Should restore the full feature set when ids is cleared', () => {
            const cluster = new Cluster({ data })
            const source = { setData: jest.fn() }
            mockMapGL.getSource.mockReturnValue(source)

            cluster.addTo(mockMap)
            cluster.setVisibleIds(null)

            expect(source.setData).toHaveBeenCalledWith({
                type: 'FeatureCollection',
                features: cluster.getFeatures(),
            })
        })

        it('Should no-op when the source is not available', () => {
            const cluster = new Cluster({ data })
            mockMapGL.getSource.mockReturnValue(undefined)

            cluster.addTo(mockMap)
            expect(() => cluster.setVisibleIds(['b'])).not.toThrow()
        })

        it('Should refresh the separate polygon source once the map settles, when the cluster has polygon features', () => {
            const polygonData = [
                {
                    type: 'Feature',
                    properties: { id: 'p' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [0, 0],
                                [0, 1],
                                [1, 1],
                                [0, 0],
                            ],
                        ],
                    },
                },
            ]
            const cluster = new Cluster({ data: polygonData })
            const source = { setData: jest.fn() }
            mockMapGL.getSource.mockReturnValue(source)
            cluster.updatePolygons = jest.fn()

            cluster.addTo(mockMap)
            cluster.setVisibleIds(['p'])

            expect(mockMapGL.once).toHaveBeenCalledWith(
                'idle',
                cluster.updatePolygons
            )
        })

        it('Should not register an idle listener when the cluster has no polygon features', () => {
            const cluster = new Cluster({ data })
            const source = { setData: jest.fn() }
            mockMapGL.getSource.mockReturnValue(source)

            cluster.addTo(mockMap)
            cluster.setVisibleIds(['b'])

            expect(mockMapGL.once).not.toHaveBeenCalled()
        })

        it('Should replace, not stack, the pending idle listener on repeated calls', () => {
            const polygonData = [
                {
                    type: 'Feature',
                    properties: { id: 'p' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [0, 0],
                                [0, 1],
                                [1, 1],
                                [0, 0],
                            ],
                        ],
                    },
                },
            ]
            const cluster = new Cluster({ data: polygonData })
            mockMapGL.getSource.mockReturnValue({ setData: jest.fn() })

            cluster.addTo(mockMap)
            cluster.setVisibleIds(['p'])
            cluster.setVisibleIds(['p'])

            expect(mockMapGL.off).toHaveBeenCalledWith(
                'idle',
                cluster.updatePolygons
            )
            expect(mockMapGL.once).toHaveBeenCalledTimes(2)
        })

        it('Should drop a hovered/selected id from the overlay once setVisibleIds() filters it out', () => {
            const cluster = new Cluster({ data })
            mockMapGL.getSource.mockReturnValue({ setData: jest.fn() })

            cluster.addTo(mockMap)
            cluster.highlight(['a', 'b'])
            updateHighlightOverlay.mockClear()

            cluster.setVisibleIds(['b'])

            expect(updateHighlightOverlay).toHaveBeenCalledTimes(1)
            expect(
                updateHighlightOverlay.mock.lastCall[1].features
            ).toMatchObject([{ properties: { id: 'b' } }])
        })
    })

    describe('onRemove', () => {
        it('Should drop the pending idle listener, so it cannot fire after removal', () => {
            const cluster = new Cluster({
                data: [
                    {
                        type: 'Feature',
                        properties: { id: 'p' },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [0, 1],
                                    [1, 1],
                                    [0, 0],
                                ],
                            ],
                        },
                    },
                ],
            })
            mockMapGL.getStyle.mockReturnValue({ layers: [] })
            mockMapGL.getSource.mockReturnValue({ setData: jest.fn() })

            cluster.addTo(mockMap)
            cluster.setVisibleIds(['p'])
            mockMapGL.off.mockClear()

            cluster.removeFrom(mockMap)

            expect(mockMapGL.off).toHaveBeenCalledWith(
                'idle',
                cluster.updatePolygons
            )
        })
    })

    describe('getFeaturesById', () => {
        it('Should resolve against the post-polygon-to-point-conversion features, not a stale reference', () => {
            const polygonData = [
                {
                    type: 'Feature',
                    properties: { id: 'p' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [0, 0],
                                [0, 1],
                                [1, 1],
                                [0, 0],
                            ],
                        ],
                    },
                },
            ]
            const cluster = new Cluster({ data: polygonData })

            const [feature] = cluster.getFeaturesById('p')

            expect(feature.geometry.type).toBe('Point')
            expect(feature.properties.isPolygon).toBe(true)
        })
    })
})
