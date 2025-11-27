const DB_NAME = 'dhis2-maps-app-db'
const STORE_NAME = 'ee-worker-cache'
const DEFAULT_TTL_MS = 1000 * 60 * 60

const openDB = () =>
    new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1)
        request.onupgradeneeded = () =>
            request.result.createObjectStore(STORE_NAME)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })

const getFromDB = async key => {
    const db = await openDB()
    return new Promise(resolve => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(key)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(null)
    })
}

const setToDB = async (key, value) => {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, key)
    return tx.complete
}

export class WorkerCache {
    constructor(ttl = DEFAULT_TTL_MS) {
        this._cache = new Map()
        this._ttl = ttl
    }

    _generateKey = (methodName, params) =>
        `${methodName}:${JSON.stringify(params)}`

    get = async (methodName, params) => {
        const key = this._generateKey(methodName, params)
        if (this._cache.has(key)) {
            const cached = this._cache.get(key)
            if (Date.now() - cached.timestamp < this._ttl) {
                return cached.data
            }
            this._cache.delete(key)
        }
        const cachedDB = await getFromDB(key)
        if (cachedDB && Date.now() - cachedDB.timestamp < this._ttl) {
            this._cache.set(key, cachedDB)
            return cachedDB.data
        }
        return null
    }

    set = async (methodName, params, data) => {
        const key = this._generateKey(methodName, params)
        const entry = { data, timestamp: Date.now() }
        this._cache.set(key, entry)
        await setToDB(key, entry)
    }

    wrap = async (methodName, params, fn) => {
        const cached = await this.get(methodName, params)
        if (cached !== null) {
            return cached
        }
        const result = await fn()
        await this.set(methodName, params, result)
        return result
    }

    static flushExpired = (ttl = DEFAULT_TTL_MS) => {
        ;(async () => {
            const db = await openDB()
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)

            let cursor = await store.openCursor()

            while (cursor) {
                const { timestamp } = cursor.value
                if (Date.now() - timestamp > ttl) {
                    await store.delete(cursor.key)
                }
                cursor = await cursor.continue()
            }
        })()
    }
}
