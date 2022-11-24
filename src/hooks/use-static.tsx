import { useRef } from 'react'

export function useStatic<T>(get: () => T) {
    const ref = useRef<null | T>(null)

    if (!ref.current) {
        ref.current = get()
    }

    return ref.current
}
