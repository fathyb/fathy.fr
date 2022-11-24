import { useEffect } from 'react'

import { useFunction } from './use-function'

export function useRequestAnimationFrame(cb: (time: number) => void) {
    const listener = useFunction(cb)

    useEffect(() => {
        let running = true
        let frame = requestAnimationFrame(raf)

        return () => {
            running = false

            cancelAnimationFrame(frame)
        }

        function raf(time: number) {
            if (running) {
                frame = requestAnimationFrame(raf)

                listener(time)
            }
        }
    }, [])
}
