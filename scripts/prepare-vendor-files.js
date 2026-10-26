// Writes third-party files into src/vendor, which is gitignored and skipped by
// d2-style. Runs after every install through the "prepare" script.
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const vendorDir = path.join(root, 'src/vendor')

fs.mkdirSync(vendorDir, { recursive: true })

fs.copyFileSync(
    path.join(root, 'node_modules/@mapbox/mapbox-gl-rtl-text/LICENSE.md'),
    path.join(vendorDir, 'mapbox-gl-rtl-text.LICENSE.md')
)

// Loaded by MapLibre's workers from a URL, so Babel copies it as-is (see babel.config.js)
fs.copyFileSync(
    path.join(
        root,
        'node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js'
    ),
    path.join(vendorDir, 'mapbox-gl-rtl-text.js')
)
