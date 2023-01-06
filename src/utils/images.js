// Only one SVG icon size is currently suppored
const svgWidth = 16
const svgHeight = 16

const credentials = 'include'

// Add image to map sprite if not exist
const addImage = (map, name, img) => {
    if (!map.hasImage(name)) {
        map.addImage(name, img)
    }
}

// Creates image from SVG data URI
const dataUri2image = dataUri =>
    new Promise((resolve, reject) => {
        const img = new Image(svgWidth, svgHeight)
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = dataUri
    })

// Fetch SVG and convert to Base64 data URI
const fetchSvg = url =>
    fetch(url, { credentials })
        .then(response => response.text())
        .then(
            svg => `data:image/svg+xml;charset=utf-8;base64,${window.btoa(svg)}`
        )
        .then(dataUri2image)

// Load and add image to map
const loadImage = map => url =>
    new Promise(resolve => {
        if (url.endsWith('.svg')) {
            fetchSvg(url)
                .then(img => {
                    addImage(map, url, img)
                    resolve(img)
                })
                .catch(error => {
                    console.log('SVG not added', url, error)
                    resolve()
                })
        } else {
            map.loadImage(url, (error, img) => {
                if (error) {
                    console.log('Image not loaded', url, error)
                }
                if (img) {
                    addImage(map, url, img)
                }
                resolve(img)
            })
        }
    })

// Load and add images to map sprite
export const addImages = async (map, images) =>
    Promise.all(images.map(loadImage(map)))

// Include cookies for cross-origin image requests
export const transformRequest = (url, resourceType) =>
    resourceType === 'Image' ? { url, credentials } : null
