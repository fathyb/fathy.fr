import { useEffect } from 'react'

import { useFunction } from './use-function'

export function useRequestAnimationFrame(cb: () => void) {
    const listener = useFunction(cb)

    useEffect(() => {
        let running = true
        const raf = () => {
            if (running) {
                requestAnimationFrame(raf)

                listener()
            }
        }

        raf()

        return () => {
            running = false
        }
    }, [])
}
