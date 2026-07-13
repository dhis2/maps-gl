/* global globalThis */

globalThis.mockMapGL = {
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    addLayer: jest.fn(),
    addSource: jest.fn(),
    addControl: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    getLayer: jest.fn(),
    getSource: jest.fn(),
    getStyle: jest.fn(() => ({ layers: [] })),
    setFeatureState: jest.fn(),
    setFilter: jest.fn(),
    setPaintProperty: jest.fn(),
    setLayoutProperty: jest.fn(),
    moveLayer: jest.fn(),
    getCanvas: jest.fn(() => ({ style: {} })),
    _getUIString: jest.fn(),
}

globalThis.mockMap = {
    getMapGL: () => globalThis.mockMapGL,
    setHoverState: jest.fn(),
    setSelectedState: jest.fn(),
    getBeforeLayerId: jest.fn(),
    invalidateInteractiveLayerIds: jest.fn(),
    styleIsLoaded: () => true,
}

// https://stackoverflow.com/questions/57943736/how-to-fix-window-url-createobjecturl-is-not-a-function-when-testing-mapbox-gl
globalThis.URL.createObjectURL ??= () => {}

// Provide TextEncoder/TextDecoder for maplibre and related libs
const { TextEncoder, TextDecoder } = require('node:util')
if (globalThis.TextEncoder === undefined) {
    globalThis.TextEncoder = TextEncoder
}
if (globalThis.TextDecoder === undefined) {
    globalThis.TextDecoder = TextDecoder
}
