import { wrap, proxy } from 'comlink'

// Only load EE worker once - returns an EE worker class

let EarthEngineWorker

const getEarthEngineWorker = async getAuthToken => {
    if (!EarthEngineWorker) {
        EarthEngineWorker = wrap(
            new Worker(new URL('../earthengine/ee_worker.js', import.meta.url))
        )
        await EarthEngineWorker.setAuthToken(proxy(getAuthToken))
    }
    return EarthEngineWorker
}

export default getEarthEngineWorker
