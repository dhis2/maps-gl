import { ScaleControl } from 'maplibre-gl'
import Attribution from './Attribution'
import Navigation from './Navigation'
import Search from './Search'
import Measure from './Measure'
import FitBounds from './FitBounds'
import Fullscreen from './Fullscreen'
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
