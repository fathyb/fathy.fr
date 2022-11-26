import { Canvas, Props as CanvasProps } from '@react-three/fiber'
import { createContext, PropsWithChildren, useContext } from 'react'
import { Camera, Vector2, Object3D, Renderer, WebGLRenderer } from 'three'

import { useStatic } from '../../hooks/use-static'
import { ThreeFrameProvider } from '../../hooks/use-three-frame'

const Context = createContext<null | SharedRenderer>(null)

export function SharedCanvas({
    depth = false,
    ...props
}: Omit<CanvasProps, 'renderer'> & { depth?: boolean }) {
    return (
        <Canvas
            {...props}
            frameloop="demand"
            //gl={(canvas) => ctx.create(canvas)}
            //gl={(canvas) => new WebGL1Renderer({ canvas })}
            gl={(canvas) =>
                new WebGLRenderer({
                    depth,
                    canvas,
                    alpha: true,
                    stencil: false,
                    antialias: true,
                    premultipliedAlpha: false,
                })
            }
        />
    )
}

export function SharedCanvasProvider({ children }: PropsWithChildren) {
    const ctx = useStatic(
        () =>
            new SharedRenderer({
                alpha: true,
                antialias: true,
                canvas: supportsOffscreen
                    ? new OffscreenCanvas(512, 512)
                    : undefined,
            }),
    )

    return (
        <Context.Provider value={ctx}>
            <ThreeFrameProvider>{children}</ThreeFrameProvider>
        </Context.Provider>
    )
}

export class SharedRenderer extends WebGLRenderer {
    public create(canvas: HTMLCanvasElement) {
        return new SharedTargetRenderer(canvas, this)
    }
}

export class SharedTargetRenderer implements Renderer {
    private dpr = 1
    private readonly ctx
    private readonly size

    constructor(
        public readonly domElement: HTMLCanvasElement,
        private readonly parent: SharedRenderer,
    ) {
        const ctx = supportsOffscreen
            ? domElement.getContext('bitmaprenderer')
            : domElement.getContext('2d', {
                  alpha: true,
                  colorSpace: 'srgb',
                  desynchronized: true,
              })

        if (!ctx) {
            throw new Error('Failed to create 2D canvas')
        }

        this.ctx = ctx
        this.size = { width: 0, height: 0 }
    }

    public setPixelRatio(dpr: number): void {
        const { width, height } = this.size

        this.dpr = dpr
        this.setSize(width, height)
    }

    public setSize(width: number, height: number, updateStyle?: boolean): void {
        const { domElement, dpr, parent, size } = this

        size.width = width
        size.height = height

        const scaledWidth = Math.floor(width * dpr)
        const scaledHeight = Math.floor(height * dpr)

        domElement.width = scaledWidth
        domElement.height = scaledHeight

        if (updateStyle !== false) {
            domElement.style.width = `${width}px`
            domElement.style.height = `${height}px`
        }

        const parentSize = new Vector2()

        parent.getSize(parentSize)

        if (parentSize.width < scaledWidth) {
            parentSize.width = scaledWidth
        }
        if (parentSize.height < scaledHeight) {
            parentSize.height = scaledHeight
        }

        parent.setSize(parentSize.width, parentSize.height, false)
    }

    public render(scene: Object3D, camera: Camera) {
        const { ctx, domElement, parent } = this
        const { width, height } = domElement
        const { domElement: parentDomElement } = parent
        const { width: parentWidth, height: parentHeight } = parentDomElement

        parent.setViewport(0, parentHeight - height, width, height)
        parent.render(scene, camera)

        if (ctx instanceof CanvasRenderingContext2D) {
            ctx.globalCompositeOperation = 'copy'
            ctx.drawImage(
                parentDomElement,
                0,
                0,
                parentWidth,
                parentHeight,
                0,
                0,
                parentWidth,
                parentHeight,
            )
        } else if (
            supportsOffscreen &&
            ctx instanceof ImageBitmapRenderingContext &&
            parentDomElement instanceof OffscreenCanvas
        ) {
            ctx.transferFromImageBitmap(
                parentDomElement.transferToImageBitmap(),
            )
        }
    }
}

const supportsOffscreen = false //typeof OffscreenCanvas === 'function'

declare class OffscreenCanvas extends HTMLCanvasElement {
    constructor(width: number, height: number)

    transferToImageBitmap(): ImageBitmap
}
