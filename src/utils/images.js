const credentials = 'include'

// Add image to map sprite if not exist
const addImage = async (map, url) => {
    try {
        if (map.hasImage(url)) {
            return map.getImage(url)
        } else {
            const img = await map.loadImage(url)
            map.addImage(url, img.data)
            return img
        }
    } catch {
        throw new Error(`Symbol not found: ${url}`)
    }
}

// Load and add images to map sprite
export const addImages = async (map, images) => {
    return await Promise.all(images.map(url => addImage(map, url)))
}

// Include cookies for cross-origin image requests
export const transformRequest = (url, resourceType) =>
    resourceType === 'Image' ? { url, credentials } : null
