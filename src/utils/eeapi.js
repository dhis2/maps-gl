const apiVersion = 'v0.1.172'
const scriptUrl = `https://cdn.rawgit.com/google/earthengine-api/${apiVersion}/javascript/build/ee_api_js.js`

// Load Earth Engine API
const loadEarthEngineAPI = () => {
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

export default loadEarthEngineAPI
