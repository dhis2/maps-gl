import { wrap, proxy, releaseProxy } from 'comlink'
// import { memoizePromise } from './ee_utils'

// Only load EE worker once - returns an EE worker class
/*
const getEarthEngineWorker = memoizePromise(async getAuthToken => {
    const EarthEngineWorker = wrap(
        new Worker(new URL('../earthengine/ee_worker.js', import.meta.url))
    )
    await EarthEngineWorker.setAuthToken(proxy(getAuthToken))
    return EarthEngineWorker
})
*/

const getEarthEngineWorker = async getAuthToken => {
    const worker = new Worker(
        new URL('../earthengine/ee_worker.js', import.meta.url)
    )
    const EarthEngineWorker = wrap(worker)
    await EarthEngineWorker.setAuthToken(proxy(getAuthToken))

    const terminateWorker = () => {
        EarthEngineWorker[releaseProxy]()
        worker.terminate()
    }

    return { EarthEngineWorker, terminateWorker }
}

export default getEarthEngineWorker
