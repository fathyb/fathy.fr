import { RefObject, useState } from 'react'

import { DebouncerOptions } from './use-debouncer'
import { useScrollListener } from './use-scroll-listener'

export type MaybeRefObject<T> = T | RefObject<T>
export type MaybeElementRef = MaybeRefObject<HTMLElement | SVGElement>

export function useVisibilityCheck(
    element: MaybeElementRef,
    options: { debounce?: DebouncerOptions } = {},
) {
    const [visible, setVisible] = useState(false)

    useScrollListener(() => setVisible(isElementVisible(element)), {
        debounce: options.debounce,
    })

    return visible
}

export function isElementVisible(ref: MaybeElementRef) {
    const element = getElement(ref)

    if (element) {
        const rect = element.getBoundingClientRect()

        return rect.y + rect.height >= 0 && rect.y <= innerHeight
    } else {
        return false
    }
}

function getElement(element: MaybeElementRef) {
    if (element instanceof HTMLElement || element instanceof SVGElement) {
        return element
    } else {
        return element.current
    }
}
