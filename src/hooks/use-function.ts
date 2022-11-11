import { useRef } from 'react'

/**
 * useFunction is a React hook that can be used to keep immutable references to functions.
 * You may want immutable function references when passing functions down a React tree through Props.
 *
 * This is the immutable equivalent of React.useCallback.
 */
export function useFunction<T extends (...args: any[]) => any>(fn: T) {
    const handler = ((...args) => ref.fn(...args)) as T
    const ref = useRef({ fn, handler }).current

    ref.fn = fn

    return ref.handler
}
