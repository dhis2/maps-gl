import { Marker } from 'maplibre-gl'
import './spiderifier.css'

/*
 * This file is based on https://github.com/bewithjonam/maplibregl-spiderifier (MIT License)
 * It was adapted to support maplibre-gl
 *
 * MIT License
 *
 * Copyright (c) 2016 manoj kumar
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

// Utility
const util = {
    each: (array, iterator) => {
        if (!array || !array.length) {
            return []
        }
        for (let i = 0; i < array.length; i++) {
            iterator(array[i], i)
        }
    },
    eachTimes: (count, iterator) => {
        if (!count) {
            return []
        }
        for (let i = 0; i < count; i++) {
            iterator(i)
        }
    },
    map: (array, iterator) => {
        const result = []
        util.each(array, (item, i) => result.push(iterator(item, i)))
        return result
    },
    mapTimes: (count, iterator) => {
        const result = []
        util.eachTimes(count, (i) => result.push(iterator(i)))
        return result
    },
}

const spiderifier = (map, userOptions) => {
    const options = {
        animate: false, // to animate the spiral
        animationSpeed: 0, // animation speed in milliseconds
        customPin: false, // If false, sets a default icon for pins in spider legs.
        initializeLeg: () => {},
        onClick: () => {},
        // --- <SPIDER TUNING Params>
        // circleSpiralSwitchover: show spiral instead of circle from this marker count upwards
        // 0 -> always spiral; Infinity -> always circle
        circleSpiralSwitchover: 9,
        circleFootSeparation: 25, // related to circumference of circle
        spiralFootSeparation: 28, // related to size of spiral (experiment!)
        spiralLengthStart: 15, // ditto
        spiralLengthFactor: 4, // ditto
        // ---
        ...userOptions,
    }

    const twoPi = Math.PI * 2
    let previousSpiderLegs = []

    // Private:
    const unspiderfy = () => {
        util.each(previousSpiderLegs.reverse(), (spiderLeg, index) => {
            if (options.animate) {
                spiderLeg.elements.container.style['transitionDelay'] =
                    (options.animationSpeed /
                        1000 /
                        previousSpiderLegs.length) *
                        index +
                    's'
                spiderLeg.elements.container.className += ' exit'
                setTimeout(
                    () => spiderLeg.marker.remove(),
                    options.animationSpeed + 100
                ) //Wait for 100ms more before clearing the DOM
            } else {
                spiderLeg.marker.remove()
            }
        })
        previousSpiderLegs = []
    }

    const spiderfy = (latLng, features) => {
        const spiderLegParams = generateSpiderLegParams(features.length)

        unspiderfy()

        const spiderLegs = util.map(features, (feature, index) => {
            const param = spiderLegParams[index]
            const elements = createMarkerElements(param, feature)
            const marker = new Marker(elements.container).setLngLat(latLng)
            const spiderLeg = { feature, elements, marker, param }

            options.initializeLeg(spiderLeg)

            elements.container.onclick = (e) => options.onClick(e, spiderLeg)

            return spiderLeg
        })

        util.each(spiderLegs.reverse(), (spiderLeg) =>
            spiderLeg.marker.addTo(map)
        )

        if (options.animate) {
            setTimeout(() => {
                util.each(spiderLegs.reverse(), (spiderLeg, index) => {
                    spiderLeg.elements.container.className = (
                        spiderLeg.elements.container.className || ''
                    ).replace('initial', '')
                    spiderLeg.elements.container.style['transitionDelay'] =
                        (options.animationSpeed / 1000 / spiderLegs.length) *
                            index +
                        's'
                })
            })
        }

        previousSpiderLegs = spiderLegs
    }

    const generateSpiderLegParams = (count) => {
        if (count >= options.circleSpiralSwitchover) {
            return generateSpiralParams(count)
        } else {
            return generateCircleParams(count)
        }
    }

    const generateSpiralParams = (count) => {
        let legLength = options.spiralLengthStart
        let angle = 0

        return util.mapTimes(count, (index) => {
            angle =
                angle +
                (options.spiralFootSeparation / legLength + index * 0.0005)

            const pt = {
                x: legLength * Math.cos(angle),
                y: legLength * Math.sin(angle),
                angle: angle,
                legLength: legLength,
                index: index,
            }

            legLength = legLength + (twoPi * options.spiralLengthFactor) / angle

            return pt
        })
    }

    const generateCircleParams = (count) => {
        const circumference = options.circleFootSeparation * (2 + count)
        const legLength = circumference / twoPi // = radius from circumference
        const angleStep = twoPi / count

        return util.mapTimes(count, (index) => {
            const angle = index * angleStep
            const x = legLength * Math.cos(angle)
            const y = legLength * Math.sin(angle)

            return { x, y, angle, legLength, index }
        })
    }

    const createMarkerElements = (spiderLegParam) => {
        const containerElem = document.createElement('div')
        const pinElem = document.createElement('div')
        const lineElem = document.createElement('div')

        containerElem.className =
            'spider-leg-container' +
            (options.animate ? ' animate initial ' : ' ')
        lineElem.className = 'spider-leg-line'
        pinElem.className =
            'spider-leg-pin' + (options.customPin ? '' : ' default-spider-pin')

        containerElem.appendChild(lineElem)
        containerElem.appendChild(pinElem)

        containerElem.style['margin-left'] = spiderLegParam.x + 'px'
        containerElem.style['margin-top'] = spiderLegParam.y + 'px'

        lineElem.style.height = spiderLegParam.legLength + 'px'
        lineElem.style.transform =
            'rotate(' + (spiderLegParam.angle - Math.PI / 2) + 'rad)'

        return { container: containerElem, line: lineElem, pin: pinElem }
    }

    // Public
    return {
        spiderfy,
        unspiderfy,
        each: (callback) => util.each(previousSpiderLegs, callback),
    }
}

export default spiderifier
