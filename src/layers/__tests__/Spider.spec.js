import {
    labelColor,
    labelFontSize,
    labelFontStyle,
    labelFontWeight,
} from '../../utils/style.js'
import { labelTextStyle } from '../Spider.js'

describe('labelTextStyle', () => {
    it('Should default color, fontSize, fontWeight and fontStyle', () => {
        const style = labelTextStyle()

        expect(style.color).toBe(labelColor)
        expect(style.fontSize).toBe(`${labelFontSize}px`)
        expect(style.fontWeight).toBe(labelFontWeight)
        expect(style.fontStyle).toBe(labelFontStyle)
    })

    it('Should use custom color, fontWeight and fontStyle', () => {
        const style = labelTextStyle({
            color: '#ff0000',
            fontWeight: 'bold',
            fontStyle: 'italic',
        })

        expect(style.color).toBe('#ff0000')
        expect(style.fontWeight).toBe('bold')
        expect(style.fontStyle).toBe('italic')
    })

    it('Should use fontSize as-is instead of appending a unit', () => {
        // fontSize always arrives as a complete CSS value (e.g. "14px"),
        // so this must not re-append "px" (regression: previously produced
        // an invalid "14pxpx", silently rejected by the browser)
        const style = labelTextStyle({ fontSize: '14px' })

        expect(style.fontSize).toBe('14px')
    })
})
