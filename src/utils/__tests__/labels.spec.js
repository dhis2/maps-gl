import { labelSource, labelLayer } from '../labels.js'
import { textOpacity } from '../style.js'

const id = 'abc'
const opacity = 0.5
const fontSize = 10
const labelNoData = 'No Data'
const isBoundary = false
const geometryPoint = {
    type: 'Point',
    coordinates: [0, 0],
}
const features = [
    {
        // Test a polygon
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                ],
            ],
        },
        properties: {
            name: 'Feature1',
            radius: 1,
            value: 1,
        },
    },
    {
        // Test a point with a valid value which is not 0
        geometry: geometryPoint,
        properties: {
            name: 'Feature2',
            radius: 1,
            value: 1,
        },
    },
    {
        // Test a point with a valid value which is 0
        geometry: geometryPoint,
        properties: {
            name: 'Feature3',
            radius: 1,
            value: 0,
        },
    },
    {
        // Test a point with no value
        geometry: geometryPoint,
        properties: {
            name: 'Feature4',
            radius: 1,
        },
    },
]
const generateLabelSourceItem = ({
    coordinates,
    name,
    anchor,
    offset,
    value,
}) => {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates,
        },
        properties: {
            name,
            anchor,
            offset,
            color: '#333',
            value,
        },
    }
}

describe('labels', () => {
    it('Handles different label sources scenario', () => {
        const expected = {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    // Label for a polygon
                    generateLabelSourceItem({
                        coordinates: [0.5, 0.5],
                        name: 'Feature1',
                        anchor: 'center',
                        offset: [0, 0],
                        value: 1,
                    }),
                    // Label for a point with a valid value which is not 0
                    generateLabelSourceItem({
                        coordinates: [0, 0],
                        name: 'Feature2',
                        anchor: 'top',
                        offset: [0, 0.5],
                        value: 1,
                    }),
                    // Label for a point with a valid value which is 0
                    generateLabelSourceItem({
                        coordinates: [0, 0],
                        name: 'Feature3',
                        anchor: 'top',
                        offset: [0, 0.5],
                        value: 0,
                    }),
                    // Label for a point with no value
                    generateLabelSourceItem({
                        coordinates: [0, 0],
                        name: 'Feature4',
                        anchor: 'top',
                        offset: [0, 0.5],
                        value: 'No Data',
                    }),
                ],
            },
        }
        const received = labelSource(
            features,
            { fontSize, labelNoData },
            isBoundary
        )

        expect(JSON.stringify(received, null, 2)).toEqual(
            JSON.stringify(expected, null, 2)
        )
    })

    it('Should set opacity for for label layer', () => {
        expect(labelLayer({ id, opacity }).paint['text-opacity']).toBe(opacity)
    })

    it('Should set default opacity for label layer', () => {
        expect(labelLayer({ id }).paint['text-opacity']).toBe(textOpacity)
    })
})
