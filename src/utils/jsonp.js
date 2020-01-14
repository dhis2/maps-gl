// Inspired by https://github.com/digidem/leaflet-bing-layer

const defaultOptions = {
    timeout: 5000,
    jsonpCallback: 'callback',
    jsonpCallbackFunction: null,
}

const generateCallbackFunction = () =>
    `jsonp_${Date.now()}_${Math.ceil(Math.random() * 100000)}`

// Known issue: Will throw 'Uncaught ReferenceError: callback_*** is not defined' error if request timeout
const clearFunction = functionName => {
    // IE8 throws an exception when you try to delete a property on window
    // http://stackoverflow.com/a/1824228/751089
    try {
        delete window[functionName]
    } catch (e) {
        window[functionName] = undefined
    }
}

const removeScript = scriptId => {
    const script = document.getElementById(scriptId)
    document.getElementsByTagName('head')[0].removeChild(script)
}

export const fetchJsonp = (url, options = {}) => {
    const timeout =
        options.timeout != null ? options.timeout : defaultOptions.timeout
    const jsonpCallback =
        options.jsonpCallback != null
            ? options.jsonpCallback
            : defaultOptions.jsonpCallback
    let timeoutId

    return new Promise((resolve, reject) => {
        const callbackFunction =
            options.jsonpCallbackFunction || generateCallbackFunction()

        window[callbackFunction] = response => {
            resolve({
                ok: true,
                json: () => Promise.resolve(response),
            })

            if (timeoutId) {
                clearTimeout(timeoutId)
            }

            removeScript(jsonpCallback + '_' + callbackFunction)
            clearFunction(callbackFunction)
        }

        url += url.indexOf('?') === -1 ? '?' : '&'

        const jsonpScript = document.createElement('script')

        jsonpScript.setAttribute(
            'src',
            url + jsonpCallback + '=' + callbackFunction
        )
        jsonpScript.id = jsonpCallback + '_' + callbackFunction

        document.getElementsByTagName('head')[0].appendChild(jsonpScript)

        timeoutId = setTimeout(() => {
            reject(new Error('JSONP request to ' + url + ' timed out'))

            clearFunction(callbackFunction)
            removeScript(jsonpCallback + '_' + callbackFunction)
        }, timeout)
    })
}
