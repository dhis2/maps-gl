import { isClusterPoint } from '../../utils/filters.js'
import Cluster from '../Cluster.js'

const findLabelLayer = cluster =>
    cluster.getLayers().find(layer => layer.id === `${cluster.getId()}-label`)

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
})
