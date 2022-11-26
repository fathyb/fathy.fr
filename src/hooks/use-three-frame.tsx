import { useThree } from '@react-three/fiber'
import {
    Context,
    useEffect,
    useContext,
    createContext,
    PropsWithChildren,
} from 'react'

import { useStatic } from './use-static'
import { useFunction } from './use-function'
import { isElementVisible } from './use-visibility-check'
import { useScrollListener } from './use-scroll-listener'

export function useThreeFrame(cb: (time: number) => void | boolean) {
    const ctx = useContext(Context)

    if (!ctx) {
        throw new Error('ThreeFrameProvider missing')
    }

    const { gl, invalidate } = useThree()
    const state = useStatic(() => ({
        visible: isElementVisible(gl.domElement),
    }))
    const render = useFunction((now: number) => {
        if (state.visible && cb(now)) {
            invalidate()
        }
    })

    useEffect(() => ctx.register(render))

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
        { debounce: { delay: 5 } },
    )
}

export function ThreeFrameProvider({
    fps,
    children,
}: PropsWithChildren<{ fps?: number }>) {
    const ctx = useStatic(() => new FrameController(fps))

    useEffect(() => ctx.start())

    return <Context.Provider value={ctx}>{children}</Context.Provider>
}

const Context = createContext<null | FrameController>(null)

class FrameController {
    private last = 0
    private running = true
    private readonly interval
    private readonly listeners = new Set<(now: number) => void>()

    constructor(fps = 30) {
        this.interval = 1000 / fps
    }

    public register(listener: (now: number) => void) {
        this.listeners.add(listener)

        return () => {
            this.listeners.delete(listener)
        }
    }

    public start() {
        this.running = true

        requestAnimationFrame((now) => this.loop(now))

        return () => this.stop()
    }

    public stop() {
        this.running = false
    }

    private loop(now: number) {
        if (!this.running) {
            return
        }

        requestAnimationFrame((now) => this.loop(now))

        const { last, interval, listeners } = this
        const elapsed = now - last

        if (now - last < interval) {
            return
        }

        this.last = now - (elapsed % interval)

        for (const listener of listeners) {
            listener(now)
        }
    }
}
