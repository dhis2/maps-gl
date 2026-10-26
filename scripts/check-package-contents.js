// Fails if a file in src/vendor is missing from build/cjs or build/es, the
// folders the package ships. Runs in CI after "yarn build".
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const vendorFiles = fs.readdirSync(path.join(root, 'src/vendor'))

const missing = ['cjs', 'es']
    .flatMap(build => vendorFiles.map(file => `build/${build}/vendor/${file}`))
    .filter(file => !fs.existsSync(path.join(root, file)))

if (vendorFiles.length === 0 || missing.length > 0) {
    console.error('Vendored files missing from the package:', missing)
    process.exit(1)
}

console.log(`The package has all ${vendorFiles.length} vendored files`)
