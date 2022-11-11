import { useEffect } from 'react'

import { useFunction } from './use-function'

export type MaybeFunction<T> = T | (() => T)

export function useEventListener<E extends string, A extends any[], R, O>(
    target: MaybeFunction<{
        addEventListener(
            event: E,
            listener: (...args: A) => R,
            options?: O,
        ): void
        removeEventListener(
            event: string,
            listener: (...args: any[]) => any,
        ): void
    }>,
    event: E,
    listener: (...args: A) => R,
    options?: O,
) {
    const callback = useFunction(listener)

    useEffect(() => {
        const eventTarget = typeof target === 'function' ? target() : target

        eventTarget.addEventListener(event, callback, options)

        return () => eventTarget.removeEventListener(event, callback)
    }, [event])
}
