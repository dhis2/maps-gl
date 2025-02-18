import { ScaleControl } from 'maplibre-gl'
import Attribution from './Attribution'
import FitBounds from './FitBounds'
import Fullscreen from './Fullscreen'
import Measure from './Measure'
import Navigation from './Navigation'
import Search from './Search'
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
