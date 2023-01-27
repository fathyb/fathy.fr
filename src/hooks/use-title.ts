import { useEffect } from 'react'

import { useTitleProvider } from '../providers/title-provider'

const me = 'Fathy Boundjadj'

export function useTitle(title: null | string) {
    const provider = useTitleProvider()
    const value = title ? `${title} - ${me}` : me

    if (provider) {
        provider.value = value
    }

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.title = value

            setSocialProperty('title', title ?? me)
        }
    }, [value])
}

function setSocialProperty(property: string, value: string) {
    getMetaHead(property).textContent = value
}

function getMetaHead(property: string) {
    const name = `og:${property}`
    const meta = document.querySelector(
        `meta[property=${JSON.stringify(name)}]`,
    )

    if (meta) {
        return meta
    } else {
        const meta = document.createElement('meta')

        meta.setAttribute('property', name)

        document.head.appendChild(meta)

        return meta
    }
}
