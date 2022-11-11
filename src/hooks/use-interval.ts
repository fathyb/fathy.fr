import { useEffect } from 'react'

import { useFunction } from './use-function'

export function useInterval(
    callback: () => void,
    { interval = 750, pause = false } = {},
) {
    const handler = useFunction(callback)

    useEffect(() => {
        if (!pause) {
            const handle = setInterval(handler, interval)

            return () => clearInterval(handle)
        }
    }, [interval, pause])
}
