import { wrap, proxy } from 'comlink'
import WorkerURL from './ee_worker.js?worker&url'

let resolvedWorker

// Return same worker if already authenticated
const getEarthEngineWorker = getAuthToken =>
    new Promise((resolve, reject) => {
        if (resolvedWorker) {
            resolve(resolvedWorker)
        } else {
            // Service Worker not supported in Safari
            const EarthEngineWorker = wrap(
                typeof SharedWorker !== 'undefined'
                    ? new SharedWorker(
                        WorkerURL,
                        { type: 'module' }
                    ).port
                    : new Worker(
                        WorkerURL,
                        { type: 'module' }
                    )
            )

            EarthEngineWorker.setAuthToken(proxy(getAuthToken))
                .then(() => {
                    resolvedWorker = EarthEngineWorker
                    resolve(EarthEngineWorker)
                })
                .catch(reject)
        }
    })

export default getEarthEngineWorker
