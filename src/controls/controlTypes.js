import {
    NavigationControl,
    AttributionControl,
    ScaleControl,
    FullscreenControl,
} from 'mapbox-gl'
import Search from './Search'
import Measure from './Measure'
import FitBounds from './FitBounds'
import './Controls.css'

export default {
    zoom: NavigationControl,
    attribution: AttributionControl,
    scale: ScaleControl,
    fullscreen: FullscreenControl,
    search: Search,
    measure: Measure,
    fitBounds: FitBounds,
}
