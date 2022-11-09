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

/*
export const transformRequest = (url, resourceType) => {
    if (resourceType === 'Image') {
        return { url, credentials: 'include' }
    }

    if (
        resourceType === 'Tile' &&
        url.includes('FeatureServer') &&
        url.includes('/8/119/122.pbf')
    ) {
        // [-12.65625, 20.632784250388028, -11.25, 21.94304553343818]
        // [-1408887.3053523686, 782715.1696402055, -1252344.2714243277, 939258.2035682457]
        // https://services3.arcgis.com/BU6Aadhn6tbBEdyk/ArcGIS/rest/services/GRID3_Sierra_Leone_Settlement_Extents/FeatureServer/0/query?f=pbf&
        // geometry=-1408887.3053549863,939258.2035709843,-1252344.271426987,1095801.2374989837&maxRecordCountFactor=4&resultOffset=0&resultRecordCount=8000&where=1=1&orderByFields=OBJECTID&outFields=OBJECTID&
        // quantizationParameters={"extent":{"xmin":-1408887.3053549863,"ymin":939258.2035709843,"xmax":-1252344.271426987,"ymax":1095801.2374989837},"mode":"view","originPosition":"upperLeft","tolerance":305.74811314062526}&resultType=tile&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryEnvelope&defaultSR=102100
        console.log('transformRequest', url)

        return {
            url: 'https://services3.arcgis.com/BU6Aadhn6tbBEdyk/ArcGIS/rest/services/GRID3_Sierra_Leone_Settlement_Extents/FeatureServer/0/query?f=pbf&geometry=-1408887.3053549863%2C782715.1696429849%2C-1252344.271426987%2C939258.2035709843&maxRecordCountFactor=4&resultOffset=0&resultRecordCount=8000&where=1%3D1&orderByFields=OBJECTID&outFields=OBJECTID&quantizationParameters=%7B%22extent%22%3A%7B%22xmin%22%3A-1408887.3053549863%2C%22ymin%22%3A782715.1696429849%2C%22xmax%22%3A-1252344.271426987%2C%22ymax%22%3A939258.2035709843%7D%2C%22mode%22%3A%22view%22%2C%22originPosition%22%3A%22upperLeft%22%2C%22tolerance%22%3A305.74811314062526%7D&resultType=tile&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryEnvelope&defaultSR=102100',
        }
    }

    return null
}
*/
