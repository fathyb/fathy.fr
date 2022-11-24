import { useEffect } from 'react'

import { DebouncerOptions, useDebouncer } from './use-debouncer'
import { useEventListener } from './use-event-listener'

export function useScrollListener(
    callback: () => void,
    {
        passive = true,
        debounce,
    }: { passive?: boolean; debounce?: DebouncerOptions } = {},
) {
    const listener = useDebouncer(callback, debounce)

    useEffect(callback, [])
    useEventListener(() => document, 'scroll', listener, { passive })
}
