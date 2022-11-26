import {
    Mesh,
    Scene,
    LinearFilter,
    WebGLRenderer,
    PlaneGeometry,
    ShaderMaterial,
    LinearEncoding,
    WebGLRenderTarget,
    OrthographicCamera,
    ClampToEdgeWrapping,
} from 'three'

export type KernelUniform<K> = keyof KernelUniforms<K>
export type KernelUniforms<K> = K extends Kernel<infer T>
    ? T
    : K extends { new (): Kernel<infer T> }
    ? T
    : never
export type KernelParameters = Record<string, { value: number | boolean }>
export interface KernelOptions<T> {
    glsl: string
    width: number
    height: number
    uniforms: T
}

export class Kernel<T extends KernelParameters> {
    public static create<T extends KernelParameters>(
        options: KernelOptions<T>,
    ): {
        new (): Kernel<T>
    } {
        return class extends Kernel<T> {
            constructor() {
                super(options)
            }
        }
    }

    public readonly texture
    public readonly uniforms

    private needsUpdate = true
    private readonly target
    private readonly scene = new Scene()
    private readonly camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1)
    private readonly renderUniforms

    constructor({ glsl: code, width, height, uniforms }: KernelOptions<T>) {
        const renderUniforms = copyUniforms(uniforms)
        const plane = new PlaneGeometry(2, 2)
        const target = new WebGLRenderTarget(width, height, {
            wrapS: ClampToEdgeWrapping,
            wrapT: ClampToEdgeWrapping,
            encoding: LinearEncoding,
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            anisotropy: 0,
            depthBuffer: false,
            generateMipmaps: false,
        })
        const material = new ShaderMaterial({
            uniforms: renderUniforms,
            fragmentShader: `
                ${code}

                void main() {
                    const vec4 mask = vec4(1.0 / 255.0 , 1.0 / 255.0 , 1.0 / 255.0 , 0.0);
                    const vec4 shift = vec4(1.0, 255.0, 65025.0, 16581375.0);
                    vec4 color = fract((2.0 + kernel()) / 4.0 * shift);
            
                    color -= color.yzww * mask;

                    gl_FragColor = color;
                }
            `,
            vertexShader: `
                varying vec2 vUv;
            
                void main() {
                    vUv = uv;
            
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
        })

        this.target = target
        this.texture = target.texture
        this.uniforms = copyUniforms(uniforms)
        this.renderUniforms = renderUniforms

        this.scene.add(new Mesh(plane, material))
    }

    public render(gl: WebGLRenderer) {
        let { needsUpdate } = this
        const { uniforms, renderUniforms } = this

        if (needsUpdate) {
            this.needsUpdate = false
        } else {
            for (const [name, { value }] of Object.entries(uniforms)) {
                const uniform = renderUniforms[name as keyof T]

                if (uniform.value !== value) {
                    uniform.value = value

                    needsUpdate = true
                }
            }

            if (!needsUpdate) {
                return
            }
        }

        gl.setRenderTarget(this.target)

        try {
            gl.render(this.scene, this.camera)
        } finally {
            gl.setRenderTarget(null)
        }
    }
}

function copyUniforms<T extends KernelParameters>(uniforms: T) {
    return Object.fromEntries(
        Object.entries(uniforms).map(([name, uniform]) => [
            name,
            { ...uniform },
        ]),
    ) as T
}
