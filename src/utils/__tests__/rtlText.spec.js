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

const response = (status, type) => ({
    ok: status === 200,
    status,
    headers: { get: () => type },
})

const pluginUrl = expect.stringMatching(
    /\/src\/vendor\/mapbox-gl-rtl-text\.js$/
)

describe('loadRTLTextPlugin', () => {
    let consoleError

    beforeEach(() => {
        global.fetch = jest.fn(() =>
            Promise.resolve(response(200, 'text/javascript'))
        )
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        consoleError.mockRestore()
        delete global.fetch
    })

    it('lazily sets the vendored plugin once it is found', async () => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()

        loadRTLTextPlugin()
        await flushPromises()

        expect(fetch).toHaveBeenCalledWith(pluginUrl, {
            signal: expect.any(AbortSignal),
        })
        expect(setRTLTextPlugin).toHaveBeenCalledWith(pluginUrl, true)
        expect(consoleError).not.toHaveBeenCalled()
    })

    it('checks the file with a GET aborted once the headers arrive', async () => {
        const { loadRTLTextPlugin } = loadModules()

        loadRTLTextPlugin()
        await flushPromises()

        const [, options] = fetch.mock.calls[0]
        expect(options.method).toBeUndefined()
        expect(options.signal.aborted).toBe(true)
    })

    it('sets the plugin only once for several maps', async () => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()

        loadRTLTextPlugin()
        loadRTLTextPlugin()
        await flushPromises()

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(setRTLTextPlugin).toHaveBeenCalledTimes(1)
    })

    it.each([
        ['missing', 404, 'text/html'],
        ['replaced by an HTML fallback page', 200, 'text/html'],
    ])('leaves the plugin unset if the file is %s', async (_, status, type) => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()
        fetch.mockResolvedValueOnce(response(status, type))

        loadRTLTextPlugin()
        await flushPromises()

        expect(setRTLTextPlugin).not.toHaveBeenCalled()
        expect(consoleError).toHaveBeenCalledWith(
            'Failed to set RTL text plugin',
            expect.any(Error)
        )
    })

    it('leaves the plugin unset if the file cannot be fetched', async () => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()
        const error = new TypeError('Failed to fetch')
        fetch.mockRejectedValueOnce(error)

        loadRTLTextPlugin()
        await flushPromises()

        expect(setRTLTextPlugin).not.toHaveBeenCalled()
        expect(consoleError).toHaveBeenCalledWith(
            'Failed to set RTL text plugin',
            error
        )
    })

    it('logs an error if the plugin cannot be set', async () => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()
        const error = new Error('setRTLTextPlugin cannot be called twice')
        setRTLTextPlugin.mockRejectedValueOnce(error)

        loadRTLTextPlugin()
        await flushPromises()

        expect(consoleError).toHaveBeenCalledWith(
            'Failed to set RTL text plugin',
            error
        )
    })

    it('logs an error if MapLibre throws before returning a promise', async () => {
        const { setRTLTextPlugin, loadRTLTextPlugin } = loadModules()
        const error = new ReferenceError('Worker is not defined')
        setRTLTextPlugin.mockImplementationOnce(() => {
            throw error
        })

        loadRTLTextPlugin()
        await flushPromises()

        expect(consoleError).toHaveBeenCalledWith(
            'Failed to set RTL text plugin',
            error
        )
    })
})
