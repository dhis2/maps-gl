import { labelLayer } from '../labels'
import { opacity as defaultOpacity } from '../style'

const id = 'abc'
const opacity = 0.5

describe('labels', () => {
    it('Should set opacity for for label layer', () => {
        expect(labelLayer({ id, opacity }).paint['text-opacity']).toBe(opacity)
    })

    it('Should set default opacity for label layer', () => {
        expect(labelLayer({ id }).paint['text-opacity']).toBe(defaultOpacity)
    })
})
