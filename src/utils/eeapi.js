// import ee from '@google/earthengine' // Run "yarn add @google/earthengine"

// Load EE API in demand
const apiVersion = 'v0.1.213'
const scriptUrl = `https://cdn.rawgit.com/google/earthengine-api/${apiVersion}/javascript/build/ee_api_js.js`

// Returns the Earth Engine API as a promise
// About the console warnings: https://issuetracker.google.com/issues/149413830
const getEarthEngineApi = () => {
    if (window.ee) {
        return Promise.resolve(window.ee)
    }

    if (window._eePromise) {
        return window._eePromise
    }

    const script = document.createElement('script')

    window._eePromise = new Promise((resolve, reject) => {
        script.onload = () => {
            delete window._eePromise

            if (window.ee) {
                resolve(window.ee)
            } else {
                reject(new Error('window.ee not found'))
            }
        }
        script.onerror = reject
    })

    script.src = scriptUrl
    document.body.appendChild(script)

    return window._eePromise
}

/* We don't want to include the full EE API in the maps-gl bundle
const getEarthEngineApi = () => {
    global.ee = ee // https://issuetracker.google.com/issues/149423765
    return ee
}
*/ 

export default getEarthEngineApi
