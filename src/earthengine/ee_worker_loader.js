import { wrap, proxy } from 'comlink'

let resolvedWorker

// Return same worker if already authenticated
const getEarthEngineWorker = (workerUrl, getAuthToken) =>
    new Promise((resolve, reject) => {
        if (resolvedWorker) {
            resolve(resolvedWorker)
        } else {
            // Service Worker not supported in Safari
            const EarthEngineWorker = wrap(
                typeof SharedWorker !== 'undefined'
                    ? new SharedWorker(new URL(workerUrl, import.meta.url), {
                          type: 'module',
                      }).port
                    : new Worker(new URL(workerUrl, import.meta.url), {
                          type: 'module',
                      })
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
