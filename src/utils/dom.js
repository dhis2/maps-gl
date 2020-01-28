export const createElement = (element, className, text, appendTo) => {
    const el = document.createElement(element)

    if (className) {
        el.className = className
    }

    if (text) {
        el.innerText = text
    }

    if (appendTo) {
        appendTo.appendChild(el)
    }

    return el
}
