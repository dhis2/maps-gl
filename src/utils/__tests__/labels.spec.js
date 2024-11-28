import { labelSource, labelLayer } from '../labels'
import defaults from '../style'

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
const generateLabelSourceItem = (coordinates, name, anchor, offset, value) => {
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
                    generateLabelSourceItem(
                        [0.5, 0.5],
                        'Feature1',
                        'center',
                        [0, 0],
                        1
                    ),
                    // Label for a point with a valid value which is not 0
                    generateLabelSourceItem(
                        [0, 0],
                        'Feature2',
                        'top',
                        [0, 0.5],
                        1
                    ),
                    // Label for a point with a valid value which is 0
                    generateLabelSourceItem(
                        [0, 0],
                        'Feature3',
                        'top',
                        [0, 0.5],
                        0
                    ),
                    // Label for a point with no value
                    generateLabelSourceItem(
                        [0, 0],
                        'Feature4',
                        'top',
                        [0, 0.5],
                        'No Data'
                    ),
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
        expect(labelLayer({ id }).paint['text-opacity']).toBe(defaults.opacity)
    })
})
