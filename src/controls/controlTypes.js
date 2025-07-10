import { ScaleControl } from 'maplibre-gl'
import Attribution from './Attribution.js'
import FitBounds from './FitBounds.js'
import Fullscreen from './Fullscreen.js'
import Measure from './Measure.js'
import Navigation from './Navigation.js'
import Search from './Search.js'
import './Controls.css'

export default {
    zoom: Navigation,
    attribution: Attribution,
    scale: ScaleControl,
    fullscreen: Fullscreen,
    search: Search,
    measure: Measure,
    fitBounds: FitBounds,
}
