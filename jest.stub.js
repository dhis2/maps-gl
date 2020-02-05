// https://stackoverflow.com/questions/57943736/how-to-fix-window-url-createobjecturl-is-not-a-function-when-testing-mapbox-gl
if (typeof window.URL.createObjectURL === 'undefined') {
    window.URL.createObjectURL = () => {}
}

/*
// https://github.com/facebook/jest/issues/3449
class Worker {
    constructor(stringUrl) {
        this.url = stringUrl
        this.onmessage = () => {}
    }

    postMessage(msg) {
        this.onmessage(msg)
    }
}

if (typeof window.Worker === 'undefined') {
    window.Worker = Worker
}
*/
