import { NavigationControl, AttributionControl, ScaleControl } from 'mapbox-gl'
import Search from './Search'
import Measure from './Measure'
import FitBounds from './FitBounds'
import Fullscreen from './Fullscreen'
import './Controls.css'

export default {
    zoom: NavigationControl,
    attribution: AttributionControl,
    scale: ScaleControl,
    fullscreen: Fullscreen,
    search: Search,
    measure: Measure,
    fitBounds: FitBounds,
}
