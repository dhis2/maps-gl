import mapboxgl from 'mapbox-gl'

export const getZoomControl = config => {
    return new mapboxgl.NavigationControl()
}

export const getControl = config => {
    switch (config.type) {
        case 'zoom':
            return getZoomControl(config)
        default:
            // console.log("Unknown control type", config.type);
            return null
    }
}

export default getControl