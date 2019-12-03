import Layer from './Layer'

class ServerCluster extends Layer {
    constructor(options) {
        super(options)

        console.log('ServerCluster', options)
    }
}

export default ClientCluster
