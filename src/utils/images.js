// Load and add images to map sprite
export const addImages = async (map, images) =>
    Promise.all(
        images.map(
            url =>
                new Promise((resolve, reject) => {
                    map.loadImage(url, (error, img) => {
                        if (error) {
                            reject(error)
                        }

                        if (!map.hasImage(url)) {
                            map.addImage(url, img)
                        }

                        resolve(img)
                    })
                })
        )
    )

// Include cookies for cross-origin image requests
export const transformRequest = (url, resourceType) =>
    resourceType === 'Image' ? { url, credentials: 'include' } : null
