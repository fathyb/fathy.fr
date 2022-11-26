import { StrictMode, useEffect } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

import { App } from './components/app'
import { StyleProvider } from './providers/style-provider'
import { RouterProvider } from './providers/router-provider'
import { ThreeFrameProvider } from './hooks/use-three-frame'

const { root, hydrate } = getRoot()
const app = (
    <>
        <StrictMode>
            <RouterProvider>
                <StyleProvider>
                    <ThreeFrameProvider>
                        <App />
                    </ThreeFrameProvider>
                    <UnmountStaticStyles />
                </StyleProvider>
            </RouterProvider>
        </StrictMode>
    </>
)

if (hydrate) {
    hydrateRoot(root, app)
} else {
    createRoot(root).render(app)
}

document.querySelector('.darkreader--fallback')?.remove()

function getRoot() {
    const root = document.getElementById('root')

    if (root) {
        return { root, hydrate: true }
    } else {
        const root = document.createElement('div')

        document.body.appendChild(root)

        return { root, hydrate: false }
    }
}

function UnmountStaticStyles() {
    useEffect(() => {
        root.classList.remove('loading')

        for (const style of Array.from(
            document.querySelectorAll('style.refloat-css'),
        )) {
            style.parentNode?.removeChild(style)
        }
    }, [])

    return null
}
