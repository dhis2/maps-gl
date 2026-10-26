// Fails if a file in src/vendor is missing from either build of the package.
// Runs in CI after "yarn build".
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const root = path.join(__dirname, '..')
const vendorFiles = fs.readdirSync(path.join(root, 'src/vendor'))

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maps-gl-'))
const tarball = path.join(tmpDir, 'package.tgz')
execFileSync('yarn', ['pack', '--filename', tarball], {
    cwd: root,
    stdio: 'ignore',
})
const packed = new Set(
    execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
        .split('\n')
        .map(file => file.replace(/^package\//, ''))
)
fs.rmSync(tmpDir, { recursive: true })

const missing = ['cjs', 'es']
    .flatMap(build => vendorFiles.map(file => `build/${build}/vendor/${file}`))
    .filter(file => !packed.has(file))

if (vendorFiles.length === 0 || missing.length > 0) {
    console.error('Vendored files missing from the package:', missing)
    process.exit(1)
}

console.log(`The package has all ${vendorFiles.length} vendored files`)
