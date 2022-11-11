import { useEffect } from 'react'

import { useTitleProvider } from '../providers/title-provider'

export function useTitle(title: string) {
    const provider = useTitleProvider()

    if (provider) {
        provider.value = title
    }

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.title = title
        }
    }, [title])
}
