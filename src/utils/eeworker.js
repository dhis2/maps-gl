import registerPromiseWorker from 'promise-worker/register'
import all, { ee } from '@google/earthengine/build/ee_api_js_debug' // Run "yarn add @google/earthengine"

const AUTH_TOKEN_SET = 'AUTH_TOKEN_SET'

self.document = {
    createElement: {},
}

console.log('goog', self.goog, all)

const setAuthToken = ({ client_id, tokenType, access_token, expires_in }) =>
    new Promise((resolve, reject) => {
        console.log('ee', ee)

        ee.data.setAuthToken(
            client_id,
            tokenType,
            access_token,
            expires_in
            // undefined,
            // a => console.log('callback', a),
            // false
        )

        ee.initialize(
            null,
            null,
            () => {
                console.log('success')
                // resolve()
            },
            error => console.log('failure', error)
        )

        resolve('hello')
    })

registerPromiseWorker((message = {}) => {
    const { type, payload } = message

    switch (type) {
        case AUTH_TOKEN_SET:
            // return 'AUTH_TOKEN_SET'
            return setAuthToken(payload)

        default:
            return 'unkown message'
    }
})

/*
onmessage = function(e) {
    console.log('Message received from main script', e)
}

setTimeout(() => {
    console.log('Posting message to main script')
    postMessage({ msg: 'Hi!' })
}, 5000)
*/
