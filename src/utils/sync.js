// Inspired by https://github.com/mapbox/mapbox-gl-sync-move/blob/master/index.js

// Move all clones to master position
const moveToMapPosition = (master, clones) => {
    const center = master.getCenter()
    const zoom = master.getZoom()
    const bearing = master.getBearing()
    const pitch = master.getPitch()

    clones.forEach(clone =>
        clone.jumpTo({
            center: center,
            zoom: zoom,
            bearing: bearing,
            pitch: pitch,
        })
    )
}

// Controls syncing of movement between multiple maps
const syncMaps = (() => {
    const syncedMapsById = {}
    const syncedHandlersById = {}

    // Creates move handlers for masters and clones
    const createHandlers = id => {
        const syncedMaps = syncedMapsById[id]
        const syncedHandlers = (syncedHandlersById[id] = [])

        syncedMaps.forEach((master, index) => {
            const clones = syncedMaps.filter((m, i) => i !== index)
            syncedHandlers[index] = sync.bind(null, id, master, clones)
        })
    }

    // Add a new synced map
    const addMap = (id, map) => {
        if (!syncedMapsById[id]) {
            syncedMapsById[id] = []
        }

        const syncedMaps = syncedMapsById[id]

        if (!syncedMaps.includes(map)) {
            updateMaps(id, [...syncedMaps, map])
        }
    }

    // Removes a synced map
    const removeMap = (id, map) => {
        const syncedMaps = syncedMapsById[id]

        if (syncedMaps && syncedMaps.includes(map)) {
            updateMaps(id, syncedMaps.filter(m => m !== map))
        }
    }

    // Update synced maps and handlers on add/remove
    const updateMaps = (id, maps) => {
        disableMapSync(id) // Remove current handlers
        syncedMapsById[id] = maps // Update synced maps
        createHandlers(id) // Create new handlers
        enableMapSync(id) // Enable the new handlers
    }

    // Turn on/off move handlers
    const toggleMapSync = (id, isOn) => {
        ;(syncedMapsById[id] || []).forEach((map, i) =>
            map[isOn ? 'on' : 'off']('move', syncedHandlersById[id][i])
        )
    }

    // Enable move handlers (turn on)
    const enableMapSync = id => toggleMapSync(id, true)

    // Disable move handlers (turn off)
    const disableMapSync = id => toggleMapSync(id, false)

    // Sync handler between master and clones
    const sync = (id, master, clones) => {
        // Disable move handler to avoid infitie loop
        disableMapSync(id)

        // Move all clones to master position
        moveToMapPosition(master, clones)

        // Enable move handler when all clones are moved
        enableMapSync(id)
    }

    // Public sync interface
    return {
        add: addMap,
        remove: removeMap,
    }
})()

export default syncMaps
