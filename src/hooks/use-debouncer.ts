import { MutableRefObject, useEffect, useRef } from 'react'

import { useFunction } from './use-function'

export interface DebouncerOptions {
    mode?: 'wait' | 'skip'
    delay?: number
    disable?: boolean
}

export function useDebouncer(
    callback: () => void,
    { delay = 100, mode = 'skip', disable }: DebouncerOptions = {},
) {
    const ref = useRef<null | NodeJS.Timeout>(null)

    useEffect(() => () => clear(ref), [])

    return useFunction(() => {
        if (disable) {
            return callback()
        }

        if (mode === 'skip') {
            if (ref.current !== null) {
                return
            }
        } else if (mode === 'wait') {
            clear(ref)
        }

        ref.current = setTimeout(() => {
            if (ref.current !== null) {
                ref.current = null

                callback()
            }
        }, delay)
    })
}

function clear(ref: MutableRefObject<null | NodeJS.Timeout>) {
    if (ref.current !== null) {
        clearTimeout(ref.current)

        ref.current = null
    }
}
