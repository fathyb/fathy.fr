import { useThree } from '@react-three/fiber'

import { useStatic } from './use-static'
import { useFunction } from './use-function'
import { isElementVisible } from './use-visibility-check'
import { useScrollListener } from './use-scroll-listener'
import { useRequestAnimationFrame } from './use-raf'

export function useThreeFrame(
    cb: (time: number) => void | boolean,
    { fps = 30 } = {},
) {
    const { gl, invalidate } = useThree()
    const state = useStatic(() => ({
        last: 0,
        visible: isElementVisible(gl.domElement),
    }))
    const render = useFunction((now: number) => {
        if (!state.visible) {
            state.last = now

            return
        }

        if (now > 0) {
            const elapsed = now - state.last
            const interval = 1000 / fps

            if (now - state.last < interval) {
                return
            }

            state.last = now - (elapsed % interval)
        }

        if (cb(now)) {
            invalidate()
        }
    })

    useRequestAnimationFrame(render)

    useScrollListener(() => {
        if (state.visible && !isElementVisible(gl.domElement)) {
            state.visible = false
        }
    })

    useScrollListener(
        () => {
            if (!state.visible && isElementVisible(gl.domElement)) {
                state.visible = true

                requestAnimationFrame(render)
            }
        },
        { debounce: { disable: true } },
    )
}
