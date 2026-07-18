---
name: maps-gl-architecture
description: Use when adding a layer or control type, touching the Earth Engine worker integration, or changing anything exported from src/index.js.
---

# maps-gl architecture

| Working on...                                                  | Read                                           |
| -------------------------------------------------------------- | ---------------------------------------------- |
| A new or existing layer/control type                           | "Registry pattern" and "Class hierarchy" below |
| The Earth Engine integration                                   | `references/earth-engine-worker.md`            |
| Anything in `src/index.js`, or wondering what's safe to change | "Public API surface" below                     |

## Registry pattern

`src/layers/layerTypes.js` and `src/controls/controlTypes.js` are plain `{ type: Class }` maps. `Map.hasLayerSupport(type)`/`hasControlSupport(type)` check membership; `Map.addLayer({ type, ...config })` looks up the class and instantiates it. Adding a new layer/control type means adding a class file and one line in the corresponding `*Types.js` registry — this is the only supported extension point, don't invent a parallel registration mechanism.

## Class hierarchy

`Map` (`Map.js`) and `Layer` (`layers/Layer.js`) both extend MapLibre's `Evented` — use `this.fire(...)`/`this.on(...)`, not a custom event system. `Layer` subclasses override `getSource()`, `getLayers()`, `getImages()`, `onAdd()`, `onRemove()`; the base `Layer.addTo(map)`/`removeFrom(map)` lifecycle handles adding/removing the MapLibre source+layers, image sprites, opacity, and click/right-click listener wiring — don't reimplement that lifecycle in a subclass. Controls follow a lighter, duck-typed contract: a class with `addTo(map)` and/or `onAdd()`/`onRemove()` returning a DOM container (mirrors MapLibre's own `IControl`) — `controls/FitBounds.js` is a minimal example.

## Public API surface

`src/index.js` exports exactly 5 things: the default `Map` class, `layerTypes`, `controlTypes` (derived from the registries above), `loadEarthEngineWorker`, `poleOfInaccessibility`. This is the entire integration point consumers (e.g. `maps-app`) use — anything else in `src/` is a private implementation detail. Changes to this exported surface are a semver concern, not just a code-review concern.

## Testing

`jest.stub.js` defines `globalThis.mockMapGL`/`mockMap` (stubs for `on`, `addLayer`, `addSource`, `getMapGL`, `styleIsLoaded`, etc.) plus browser polyfills MapLibre needs under jsdom (`URL.createObjectURL`, `TextEncoder`/`TextDecoder`). Use these globals instead of re-mocking MapLibre per test. Manual mocks exist for `uuid` (`src/__mocks__/uuid.js`) and the vendored Earth Engine API (`src/earthengine/__mocks__/ee_api_js_worker.js`) so unit tests don't pull in the real vendored code.
