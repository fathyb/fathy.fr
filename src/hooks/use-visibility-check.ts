import { RefObject, useState } from 'react'

import { useScrollListener } from './use-scroll-listener'

export function useVisibilityCheck(ref: RefObject<HTMLElement>) {
    const [visible, setVisible] = useState(false)

    useScrollListener(() => {
        const rect = ref.current?.getBoundingClientRect()

        setVisible(
            rect ? rect.y + rect.height >= 0 && rect.y <= innerHeight : false,
        )
    })

    return visible
}
