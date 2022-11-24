import {
    Mesh,
    OrthographicCamera,
    PlaneGeometry,
    Scene,
    ShaderMaterial,
    WebGLRenderer,
    WebGLRenderTarget,
} from 'three'

export type HeatComputeShaderUniform = keyof HeatComputeShaderUniforms
export type HeatComputeShaderUniforms =
    typeof HeatComputeShaderUniforms extends Readonly<infer T> ? T : never
export const HeatComputeShaderUniforms = Object.freeze({
    omega: { value: 1 },
    phase: { value: 1 },
    harmonics: { value: 1 },
    conductivity: { value: 1 },
})

export class HeatComputeShader {
    public readonly texture
    public readonly uniforms = { ...HeatComputeShaderUniforms }

    private readonly target
    private readonly scene = new Scene()
    private readonly camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1)
    private readonly renderUniforms = { ...this.uniforms }

    constructor(width = 2048, height = 256) {
        const plane = new PlaneGeometry(2, 2)
        const target = new WebGLRenderTarget(width, height)
        const material = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.renderUniforms,
        })

        this.target = target
        this.texture = this.target.texture
        this.scene.add(new Mesh(plane, material))
    }

    public render(renderer: WebGLRenderer) {
        let needsUpdate = false
        const { uniforms, renderUniforms } = this

        for (const [name, { value }] of Object.entries(uniforms)) {
            const uniform = renderUniforms[name as HeatComputeShaderUniform]

            if (uniform.value !== value) {
                uniform.value = value

                needsUpdate = true
            }
        }

        if (!needsUpdate) {
            return
        }

        renderer.setRenderTarget(this.target)

        try {
            renderer.render(this.scene, this.camera)
        } finally {
            renderer.setRenderTarget(null)
        }
    }
}

const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    precision mediump float;

    varying vec2 vUv;

    uniform float omega;
    uniform float phase;
    uniform float harmonics;
    uniform float conductivity;

    #define PI 3.1415926535897932384626433832795

    void main() {
        float curve = 0.0; 
        float o_pi = PI * omega;
        float dx = -conductivity * (vUv.y / 15.0);
        float pi_half = PI / 2.0;
        float axis = vUv.x + phase;
        bool square = harmonics > 1.0;
        bool initial = vUv.y <= 1.0 / 1024.0 && phase == 0.5;
        
        if (initial && square) {
            curve = x < 0.5 ? 1.0 : -1.0;
        } else {
            float amp = square ? (4.0 / PI - 1.0) + 1.0 : 1.0;

            for(float i = 1.0; i <= 128.0; i += 2.0) {
                if (i > harmonics) {
                    break;
                }

                float o = o_pi * i;
                float wave = cos((o * axis) - pi_half) * exp(dx * o * o);

                curve += wave * (1.0 / i) * amp;
            }
        }

        gl_FragColor.a = (1.0 + curve) * 0.5;
    }
`
