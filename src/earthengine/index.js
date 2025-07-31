import getEarthEngineWorker from './ee_worker_loader.js'
import './ee_worker.js' // Ensure Vite can resolve this file when this package is symlinked via `yarn link` into another project

export default getEarthEngineWorker
