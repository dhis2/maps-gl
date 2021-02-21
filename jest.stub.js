global.mockMapGL = {
    addLayer: jest.fn(),
    addSource: jest.fn(),
    getLayer: jest.fn(),
}

global.mockMap = {
    getMapGL: () => mockMapGL,
    setHoverState: jest.fn(),
}

// https://stackoverflow.com/questions/57943736/how-to-fix-window-url-createobjecturl-is-not-a-function-when-testing-mapbox-gl
if (typeof window.URL.createObjectURL === 'undefined') {
    window.URL.createObjectURL = () => {}
}
