import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Vector3, DataTexture, LinearEncoding } from 'three'

import MiddleDiffusionData from '../../generated/middle.heat-diffusion.dat'
import SimpleDiffusionData from '../../generated/simple.heat-diffusion.dat'
import ContactDiffusionData from '../../generated/contact.heat-diffusion.dat'
import { useLazy } from '../../hooks/use-lazy-ref'

export type HeatShaderModel = 'middle' | 'simple' | 'contact'

export interface HeatShaderProps {
    cool?: boolean
    delay?: number
    fragment?: string
    model?: HeatShaderModel
}

let middleDiffusionData: null | Uint8Array = null
let simpleDiffusionData: null | Uint8Array = null
let contactDiffusionData: null | Uint8Array = null
const animationDuration = 5000

export function useHeatShader({
    cool,
    model,
    fragment,
    delay = 0,
}: HeatShaderProps) {
    if (!middleDiffusionData) {
        throw load()
    }

    const state = useRef({ rewind: false, time: { value: 0, real: 0 } })
    const shaders = useLazy(() => ({
        extend,
        time: state.current.time,
        main: extend({ model, fragment, time: state.current.time }),
        topCap: extend({
            model,
            time: state.current.time,
            fragment: `
                void main() {
                    gl_FragColor = vec4(heat(1.0).rgb, 1.0);
                }
            `,
        }),
        bottomCap: extend({
            model,
            time: state.current.time,
            fragment: `
                void main() {
                    gl_FragColor = vec4(heat(0.0).rgb, 1.0);
                }
            `,
        }),
    }))

    useFrame(() => {
        if (cool) {
            const value = animate(
                (performance.now() % animationDuration) / animationDuration,
            )

            state.current.time.real = value
            state.current.time.value = Math.max(
                0,
                (value - delay) / (1 - delay),
            )

            if (state.current.time.value <= 0) {
                state.current.rewind = false
            } else if (state.current.time.value >= 1) {
                state.current.rewind = true
            }
        }
    })

    return shaders
}

const offset = 0.925

function animate(time: number) {
    if (time < offset) {
        return time / offset
    } else {
        return 1 - (time - offset) / (1 - offset)
    }
}

async function load() {
    await Promise.all([
        fetch(MiddleDiffusionData).then(async (res) => {
            middleDiffusionData = convert(await res.arrayBuffer())
        }),
        fetch(SimpleDiffusionData).then(async (res) => {
            simpleDiffusionData = convert(await res.arrayBuffer())
        }),
        fetch(ContactDiffusionData).then(async (res) => {
            contactDiffusionData = convert(await res.arrayBuffer())
        }),
    ])
}

function convert(buffer: ArrayBuffer) {
    const data = new Uint8Array(buffer)
    const texture = new Uint8Array(data.length * 4)

    for (let i = 0; i < data.length; i++) {
        texture[i * 4] = data[i]
    }

    return texture
}

function extend({
    time,
    model,
    scale = 1,
    offset = 0,
    fragment,
}: {
    time?: { value: number }
    model?: HeatShaderModel
    scale?: number
    offset?: number
    fragment?: string
}) {
    const texture = new DataTexture(
        model === 'contact'
            ? contactDiffusionData
            : model === 'simple'
            ? simpleDiffusionData
            : middleDiffusionData,
        256,
        256,
    )

    texture.encoding = LinearEncoding
    texture.needsUpdate = true

    return {
        wireframe: false,
        uniforms: {
            time: time ?? { value: 0 },
            hot: { value: hsl('#ff2e69') },
            cold: { value: hsl('#0ffbff') },
            scale: { value: scale },
            offset: { value: offset },
            opacity: { value: 1 },
            diffusion: { value: texture },
        },
        vertexShader: `
            varying vec2 vUv;
    
            void main() {
                vUv = uv;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float scale;
            uniform float offset;
            uniform float opacity;
            uniform bool cap;
            uniform vec3 hot;
            uniform vec3 cold;
            uniform sampler2D diffusion;
        
            varying vec2 vUv;

            vec3 hsvlerp(in vec3 hsv1, in vec3 hsv2, in float rate) {
                float hue = (mod(mod((hsv2.x - hsv1.x), 1.0) + 1.5, 1.0) - 0.5) * rate + hsv1.x;
                vec3 hsv = vec3(hue, mix(hsv1.yz, hsv2.yz, rate));
                vec3 rgb = clamp(abs(mod(hsv.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);

                return hsv.z * mix(vec3(1.0), rgb, hsv.y);
            }

            vec4 heat(float axis) {
                float curve = texture2D(diffusion, vec2((axis + offset) * scale, time)).r;

                return vec4(hsvlerp(cold, hot, curve), curve);
            }

            ${
                fragment ??
                `
                    void main() {
                        gl_FragColor = vec4(heat(vUv.y).rgb, 1.0 * opacity);
                    }
                `
            }
        `,
    }
}

function hsl(color: string) {
    const [r, g, b] = new Color(color).toArray()
    const min = Math.min(r, g, b)
    const max = Math.max(r, g, b)
    const d = max - min
    const s = max == 0 ? 0 : d / max
    const v = max
    let h = 0

    switch (max) {
        case min:
            h = 0
            break
        case r:
            h = (g - b) / d + (g < b ? 6 : 0)
            break
        case g:
            h = (b - r) / d + 2
            break
        case b:
            h = (r - g) / d + 4
            break
    }

    return new Vector3(h / 6, s, v)
}
