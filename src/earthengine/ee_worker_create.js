export default function createWorkerUrl() {
    return new URL('./ee_worker.js', import.meta.url)
}
