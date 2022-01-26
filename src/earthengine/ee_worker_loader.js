import { wrap, proxy } from 'comlink'

let resolvedWorker

// Return same worker if already authenticated
const getEarthEngineWorker = getAuthToken =>
    new Promise((resolve, reject) => {
        console.log('getEarthEngineWorker')

        if (resolvedWorker) {
            resolve(resolvedWorker)
        } else {
            // Service Worker not supported in Safari
            /*
            const EarthEngineWorker = wrap(
                typeof SharedWorker !== 'undefined'
                    ? new SharedWorker(
                          new URL(
                              '../earthengine/ee_worker.js',
                              import.meta.url
                          )
                      ).port
                    : new Worker(
                          new URL(
                              '../earthengine/ee_worker.js',
                              import.meta.url
                          )
                      )
            )
            */

            const EarthEngineWorker = wrap(
                new Worker(
                    new URL('../earthengine/ee_worker.js', import.meta.url)
                )
            )

            EarthEngineWorker.setAuthToken(proxy(getAuthToken))
                .then(() => {
                    console.log('setAuthToken after')
                    resolvedWorker = EarthEngineWorker
                    resolve(EarthEngineWorker)
                })
                .catch(reject)
        }
    })

export default getEarthEngineWorker
