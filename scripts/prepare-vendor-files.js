// Writes third-party files into src/vendor, which is gitignored and skipped by
// d2-style. Runs after every install through the "prepare" script.
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const vendorDir = path.join(root, 'src/vendor')

const fromPackage = file => path.join(root, 'node_modules', file)
const toVendor = file => path.join(vendorDir, file)

fs.mkdirSync(vendorDir, { recursive: true })

// MapLibre RTL text plugin, used by MapLibre's workers: copied unchanged,
// since the workers load it from a URL (Babel skips it, see babel.config.js)
fs.copyFileSync(
    fromPackage('@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js'),
    toVendor('mapbox-gl-rtl-text.js')
)
fs.copyFileSync(
    fromPackage('@mapbox/mapbox-gl-rtl-text/LICENSE.md'),
    toVendor('mapbox-gl-rtl-text.LICENSE.md')
)

// Earth Engine API, used by the EE web worker: copied with a footer,
// since the compiled build has no export and gets its global from `this`
const eeApi = fs.readFileSync(
    fromPackage('@google/earthengine/build/ee_api_js_npm.js'),
    'utf8'
)
fs.writeFileSync(
    toVendor('ee_api_js_worker.js'),
    `${eeApi}
goog.Timer.defaultTimerObject = self;
goog.global.ee = ee;
export default ee;
`
)
fs.copyFileSync(
    fromPackage('@google/earthengine/LICENSE'),
    toVendor('ee_api_js_worker.LICENSE')
)
