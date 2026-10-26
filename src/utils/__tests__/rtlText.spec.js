jest.mock('maplibre-gl', () => ({
    setRTLTextPlugin: jest.fn(() => Promise.resolve()),
}))

const loadModules = () => {
    let modules

    jest.isolateModules(() => {
        modules = {
            setRTLTextPlugin: require('maplibre-gl').setRTLTextPlugin,
            loadRTLTextPlugin: require('../rtlText.js').loadRTLTextPlugin,
        }
    })

    return modules
}

const flushPromises = () => new Promise(resolve => setTimeout(resolve))

describe('loadRTLTextPlugin', () => {
    it('lazily sets the vendored plugin', () => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()

        loadRTLTextPlugin()

        expect(setRTLTextPlugin).toHaveBeenCalledWith(
            expect.stringMatching(/\/src\/vendor\/mapbox-gl-rtl-text\.js$/),
            true
        )
    })

    it('sets the plugin only once for several maps', () => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()

        loadRTLTextPlugin()
        loadRTLTextPlugin()

        expect(setRTLTextPlugin).toHaveBeenCalledTimes(1)
    })

    it('logs an error if the plugin cannot be set', async () => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()
        const error = new Error('setRTLTextPlugin cannot be called twice')
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {})
        setRTLTextPlugin.mockRejectedValueOnce(error)

        loadRTLTextPlugin()
        await flushPromises()

        expect(consoleError).toHaveBeenCalledWith(
            'Failed to set RTL text plugin',
            error
        )
        consoleError.mockRestore()
    })

    it('logs an error if MapLibre throws before returning a promise', () => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()
        const error = new ReferenceError('Worker is not defined')
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {})
        setRTLTextPlugin.mockImplementationOnce(() => {
            throw error
        })

        loadRTLTextPlugin()

        expect(consoleError).toHaveBeenCalledWith(
            'Failed to set RTL text plugin',
            error
        )
        consoleError.mockRestore()
    })
})
