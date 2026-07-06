import { Point } from 'maplibre-gl'
import { setTemplate } from '../utils/core.js'
import spiderifier from '../utils/spiderifier.js'
import {
    eventStrokeColor as strokeColor,
    labelColor,
    labelFontSize,
    labelFontStyle,
    labelFontWeight,
    strokeWidth,
} from '../utils/style.js'

const labelTextStyle = ({ color, fontSize, fontWeight, fontStyle } = {}) => ({
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    paddingTop: '2px',
    color: color || labelColor,
    fontSize: fontSize || `${labelFontSize}px`,
    fontWeight: fontWeight || labelFontWeight,
    fontStyle: fontStyle || labelFontStyle,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
})

const Spider = function (map, options) {
    const initializeLeg = leg => {
        const { feature, elements, param } = leg
        const {
            radius,
            fillColor,
            opacity,
            hoverLabel,
            showLabel,
            hideLabel,
            label,
            labelStyle,
        } = options
        const color = feature.properties.color || fillColor
        const marker = document.createElement('div')
        const { angle } = param
        const deltaX = Math.cos(angle) * radius
        const deltaY = Math.sin(angle) * radius

        marker.setAttribute(
            'style',
            `
            width: ${radius * 2}px;
            height: ${radius * 2}px;
            margin-left: -${radius}px;
            margin-top: -${radius}px;
            background-color: ${color};
            border: ${strokeWidth}px solid ${strokeColor};
            border-radius: 50%;
            transform: translate(${deltaX}px, ${deltaY}px);`
        )

        elements.container.style.opacity = opacity
        elements.pin.appendChild(marker)

        if (label) {
            const el = document.createElement('div')
            el.textContent = setTemplate(label, feature.properties)
            Object.assign(el.style, labelTextStyle(labelStyle))
            marker.style.position = 'relative'
            marker.appendChild(el)
        }

        if (hoverLabel && showLabel) {
            const content = setTemplate(hoverLabel, feature.properties)
            marker.addEventListener('mouseover', evt => {
                const rect = map.getContainer().getBoundingClientRect()
                const lngLat = map.unproject({
                    x: evt.clientX - rect.left,
                    y: evt.clientY - rect.top,
                })
                showLabel(content, lngLat)
            })
            marker.addEventListener(
                'mouseleave',
                () => hideLabel && hideLabel()
            )
        }
    }

    const onClick = (evt, leg) => {
        evt.stopPropagation()

        const { feature, marker, param } = leg
        const { angle, legLength } = param
        const length = legLength + options.radius
        const offset = new Point(
            length * Math.cos(angle),
            length * Math.sin(angle)
        )
        const point = map.project(marker.getLngLat()).add(offset)
        const { lng, lat } = map.unproject(point)

        options.onClick({
            type: 'click',
            coordinates: [lng, lat],
            position: [evt.x, evt.pageY || evt.y],
            feature: feature,
        })
    }

    const spider = spiderifier(map, {
        animate: true,
        animationSpeed: 200,
        customPin: true,
        initializeLeg: initializeLeg,
        onClick: onClick,
    })
    let spiderId

    const setOpacity = opacity => {
        if (spiderId) {
            spider.each(leg => (leg.elements.container.style.opacity = opacity))
        }
    }

    const spiderfy = (clusterId, lnglat, features) => {
        if (clusterId !== spiderId) {
            spider.spiderfy(lnglat, features)
            spiderId = clusterId

            // Remove before re-adding to guarantee at most one listener exists,
            // even if spiderfy is called multiple times without unspiderfy in between
            map.off('click', unspiderfy)
            map.on('click', unspiderfy)
        }
    }

    const unspiderfy = () => {
        if (spiderId) {
            spider.unspiderfy()

            if (options.onClose) {
                options.onClose(spiderId)
            }

            spiderId = null

            map.off('click', unspiderfy)
        }
    }

    const isExpanded = clusterId => clusterId === spiderId

    const getId = () => spiderId

    return {
        spiderfy,
        unspiderfy,
        setOpacity,
        isExpanded,
        getId,
    }
}

export default Spider
