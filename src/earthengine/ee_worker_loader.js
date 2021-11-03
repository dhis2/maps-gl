import { wrap } from 'comlink'

// Only load EE worker once - returns an EE worker class

let EarthEngineWorker

const getEarthEngineWorker = () => {
    if (!EarthEngineWorker) {
        EarthEngineWorker = wrap(
            new Worker(new URL('../earthengine/ee_worker.js', import.meta.url))
        )
    }
    return EarthEngineWorker
}

export default getEarthEngineWorker
