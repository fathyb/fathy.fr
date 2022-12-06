import { useEffect, useState } from 'react'

export function usePromise<T>(get: () => T | Promise<T>, deps: unknown[]) {
    const [result, setResult] = useState<Result<T>>([
        null,
        { error: null, pending: true },
    ])

    useEffect(() => {
        let running = true

        Promise.resolve()
            .then(get)
            .then((result) => {
                if (running) {
                    setResult([result, { error: null, pending: false }])
                }
            })
            .catch((error) => {
                if (running) {
                    setResult([null, { error, pending: false }])
                }
            })

        return () => {
            running = false
        }
    }, deps)

    return result
}

type Result<T> =
    | [T, { error: null; pending: false }]
    | [null, { error: null; pending: true }]
    | [null, { error: unknown; pending: false }]
