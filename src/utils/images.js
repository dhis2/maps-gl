const imageWidth = 16
const imageHeight = 16

const addImage = (map, name, img) => {
    if (!map.hasImage(name)) {
        map.addImage(name, img)
    }
}

// https://stackoverflow.com/questions/69314193/cannot-create-bitmap-from-svg
const dataUri2image = dataUri =>
    new Promise(resolve => {
        const img = new Image(imageWidth, imageHeight)
        img.onload = () => resolve(img)
        img.onerror = resolve
        img.src = dataUri
    })
// https://github.com/mapbox/mapbox-gl-js/issues/5529
const fetchSvg = url =>
    fetch(url, { credentials: 'include' })
        .then(response => response.text())
        .then(svg => `data:image/svg+xml;charset=utf-8;base64,${btoa(svg)}`)
        .then(dataUri2image)

/*        
const transparentPngUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII='

const addfallbackImage = (map, url) =>
    new Promise((resolve, reject) =>
        map.loadImage(transparentPngUrl, (error, img) => {
            if (error) {
                reject(error)
            }
            addImage(map, url, img)
            resolve(img)
        })
    )
*/

const loadImage = map => url =>
    new Promise(resolve => {
        if (url.endsWith('.svg')) {
            fetchSvg(url)
                .then(img => {
                    addImage(map, url, img)
                    resolve(img)
                })
                .catch(error => {
                    console.log('Something wrong with the SVG', url, error)
                    resolve()
                })
        } else {
            map.loadImage(url, (error, img) => {
                if (error) {
                    console.log('Something wrong with the image', url, error)
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
    resourceType === 'Image' ? { url, credentials: 'include' } : null
