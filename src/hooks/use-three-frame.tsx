import { useThree } from '@react-three/fiber'
import { Camera, Scene, WebGLRenderer } from 'three'
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
import { useCanvasRemount } from '../posts/every-sin/shared-renderer'

export function useThreeFrame(cb: (time: number) => void | boolean) {
    const ctx = useContext(Context)

    if (!ctx) {
        throw new Error('ThreeFrameProvider missing')
    }

    const three = useThree()
    const state = useStatic(() => ({ visible: false }))
    const remount = useCanvasRemount()
    const render = useFunction((now: number) => {
        if (state.visible) {
            if (three.gl.getContext().isContextLost()) {
                remount()
            } else {
                return cb(now) === true
            }
        }

        return false
    })

    useEffect(() => ctx.register(three, render), [])

    useScrollListener(() => {
        if (state.visible && !isElementVisible(three.gl.domElement)) {
            state.visible = false
        }
    })

    useScrollListener(
        () => {
            if (!state.visible && isElementVisible(three.gl.domElement)) {
                state.visible = true
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

    useEffect(() => ctx.start(), [])

    return <Context.Provider value={ctx}>{children}</Context.Provider>
}

const Context = createContext<null | FrameController>(null)

type RenderContext = { gl: WebGLRenderer; scene: Scene; camera: Camera }
type RenderListener = (now: number) => boolean

class FrameController {
    private last = 0
    private running = false
    private readonly interval
    private readonly listeners = new Map<RenderListener, RenderContext>()

    constructor(fps = 30) {
        this.interval = 1000 / fps
    }

    public register(ctx: RenderContext, listener: RenderListener) {
        this.listeners.set(listener, ctx)

        return () => {
            this.listeners.delete(listener)
        }
    }

    public start() {
        if (this.running) {
            throw new Error('FrameController already started')
        }

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

        const { last, interval } = this
        const elapsed = now - last

        if (now - last < interval) {
            return
        }

        this.last = now - (elapsed % interval)

        const contexts = new Map<HTMLElement, RenderContext>()
        const { listeners } = this

        for (const [listener, ctx] of listeners) {
            if (listener(now)) {
                contexts.set(ctx.gl.domElement, ctx)
            }
        }

        for (const { gl, scene, camera } of contexts.values()) {
            gl.render(scene, camera)
        }
    }
}
