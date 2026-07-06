import { isClusterPoint } from '../../utils/filters.js'
import ServerCluster from '../ServerCluster.js'

const findLabelLayer = cluster =>
    cluster.getLayers().find(layer => layer.id === `${cluster.getId()}-label`)

describe('ServerCluster', () => {
    it('Should not add a label layer when label is not set', () => {
        const cluster = new ServerCluster({})

        expect(findLabelLayer(cluster)).toBeUndefined()
    })

    it('Should inherit addLabelLayer from Cluster', () => {
        const cluster = new ServerCluster({ label: '{name}' })
        const layer = findLabelLayer(cluster)

        expect(layer).toBeDefined()
        expect(layer.source).toBe(cluster.getId())
        expect(layer.filter).toEqual(isClusterPoint)
    })

    it('Should apply labelStyle to the label layer', () => {
        const cluster = new ServerCluster({
            label: '{name}',
            labelStyle: { fontSize: 14, color: '#fff' },
        })
        const layer = findLabelLayer(cluster)

        expect(layer.layout['text-size']).toBe(14)
        expect(layer.paint['text-color']).toBe('#fff')
    })
})
