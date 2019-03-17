export const addImages = async (map, images) =>
    Promise.all(
        images.map(
            url =>
                new Promise((resolve, reject) => {
                    map.loadImage(
                        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png',
                        (error, img) => {
                            if (error) reject(error)
                            if (!map.hasImage(url)) {
                                map.addImage(url, img)
                            }
                            resolve(img)
                        }
                    )
                })
        )
    )
