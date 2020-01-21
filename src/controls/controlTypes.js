import { NavigationControl, ScaleControl, FullscreenControl } from 'mapbox-gl'
import Search from './Search'
import Measure from './Measure'
import FitBounds from './FitBounds'

export default {
    zoom: NavigationControl,
    scale: ScaleControl,
    fullscreen: FullscreenControl,
    search: Search,
    measure: Measure,
    fitBounds: FitBounds,
}
