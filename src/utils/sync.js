// Keep track of attached move handlers
const moveHandlers = {}

// Returns move handlers for one map
const getMoveHandlers = map => Object.values(moveHandlers[map._mapId] || {})

// Add move handlers for one map
const addMoveHandlers = map => {
    getMoveHandlers(map).forEach(handler => map.on('move', handler))
}

// Remove move handlers for one map
const removeMoveHandlers = map => {
    getMoveHandlers(map).forEach(handler => map.off('move', handler))
}

// Move map B to the position of map A
const moveToMapPosition = (mapA, mapB) => {
    // Remove move handlers to avoid infinite loop
    removeMoveHandlers(mapB)

    mapB.jumpTo({
        center: mapA.getCenter(),
        zoom: mapA.getZoom(),
        bearing: mapA.getBearing(),
        pitch: mapA.getPitch(),
    })

    // Attach move handlers again after map movement
    addMoveHandlers(mapB)
}

// Synchronize the view of two maps
export const sync = (mapA, mapB) => {
    const onMove = () => moveToMapPosition(mapA, mapB)

    // Keep track for attached move handlers
    moveHandlers[mapA._mapId] = moveHandlers[mapA._mapId] || {}
    moveHandlers[mapA._mapId][mapB._mapId] = onMove

    mapA.on('move', onMove)
}

// Remove synchronize between two maps
export const unsync = (mapA, mapB) => {
    const mapHandlers = moveHandlers[mapA._mapId]

    if (mapHandlers) {
        const handler = mapHandlers[mapB._mapId]

        if (handler) {
            mapA.off(handler)
            delete mapHandlers[mapB._mapId]
        }

        if (!Object.keys(mapHandlers).length) {
            delete moveHandlers[mapA._mapId]
        }
    }
}
