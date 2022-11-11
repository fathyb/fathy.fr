import { useEffect } from 'react'

import { useDebouncer } from './use-debouncer'
import { useEventListener } from './use-event-listener'

export function useScrollListener(
    callback: () => void,
    { passive = true } = {},
) {
    const listener = useDebouncer(callback)

    useEffect(callback, [])
    useEventListener(() => document, 'scroll', listener, { passive })
}
