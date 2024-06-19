global.mockMapGL = {
    on: jest.fn(),
    addLayer: jest.fn(),
    addSource: jest.fn(),
    addControl: jest.fn(),
    getLayer: jest.fn(),
    getSource: jest.fn(),
    setFeatureState: jest.fn(),
    _getUIString: jest.fn(),
}

global.mockMap = {
    getMapGL: () => mockMapGL,
    setHoverState: jest.fn(),
    getBeforeLayerId: jest.fn(),
    styleIsLoaded: () => true,
}

// https://stackoverflow.com/questions/57943736/how-to-fix-window-url-createobjecturl-is-not-a-function-when-testing-mapbox-gl
if (typeof window.URL.createObjectURL === 'undefined') {
    window.URL.createObjectURL = () => {}
}
