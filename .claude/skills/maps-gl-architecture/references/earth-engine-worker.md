# Earth Engine worker boundary

`earthengine/index.js` → `ee_worker_loader.js` spins up a `SharedWorker` (falls back to a plain `Worker` in Safari, which lacks `SharedWorker`) running `ee_worker.js`, wired up with Comlink (`wrap`/`expose`/`proxy` from the `comlink` package). `ee_api_js_worker.js` is a large vendored copy of Google's `earthengine-api`.

This worker boundary is a hard architectural line: code inside `ee_worker.js` / `ee_api_js_worker.js` / `ee_worker_utils.js` runs in a separate thread and can only communicate via the Comlink-proxied interface exposed in `ee_worker.js` — it has no direct DOM or map access. If you're adding an Earth Engine capability, decide up front whether the logic belongs on the worker side (data fetching/processing) or the main-thread side (rendering the result as a layer) — don't reach across the boundary directly.

`ee_worker_cache.js` wraps expensive worker calls (`getTileUrl`, `getPeriods`, `getAggregations`) with its own `wrap()` caching helper — check there before assuming a repeated call is expensive.
