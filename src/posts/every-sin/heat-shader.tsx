import { useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Color, Vector3, IUniform } from 'three'

import { useStatic } from '../../hooks/use-static'
import { useThreeFrame } from '../../hooks/use-three-frame'
import { HeatComputeShader } from './heat-compute-shader'

export type HeatShaderModel = 'middle' | 'simple' | 'contact'
export type ShaderUniforms = Record<string, undefined | IUniform>

export interface HeatShaderProps {
    cool?: boolean
    delay?: number
    rewind?: boolean
    fragment?: string
    uniforms?: ShaderUniforms
    model?: HeatShaderModel
}

const animationDuration = 5000

export function useHeatShader({
    cool,
    model,
    fragment,
    uniforms: mainUniforms,
    delay = 0,
    rewind = true,
}: HeatShaderProps) {
    const state = useRef({ rewind: false, time: { value: 0, real: 0 } })
    const shaders = useStatic(() => ({
        extend,
        time: state.current.time,
        main: extend({ fragment }),
        topCap: extend({
            fragment: `
                void main() {
                    gl_FragColor = vec4(heat(1.0).rgb, 1.0);
                }
            `,
        }),
        bottomCap: extend({
            fragment: `
                void main() {
                    gl_FragColor = vec4(heat(0.0).rgb, 1.0);
                }
            `,
        }),
    }))

    useThreeFrame((time) => {
        if (!cool) {
            return
        }

        if (!rewind) {
            state.current.time.real = state.current.time.value = time / 1_000

            return
        }

        const value = animate(
            (time % animationDuration) / animationDuration,
            rewind,
        )

        state.current.time.real = value
        state.current.time.value = Math.max(0, (value - delay) / (1 - delay))

        if (state.current.time.value <= 0) {
            state.current.rewind = false
        } else if (state.current.time.value >= 1) {
            state.current.rewind = true
        }

        return true
    })

    return shaders

    function extend<U extends Record<string, IUniform>>({
        fragment,
        uniforms,
        scale = 1,
        offset = 0,
    }: {
        scale?: number
        offset?: number
        fragment?: string
        uniforms?: U
    }) {
        const contact = model === 'contact'
        const compute = new HeatComputeShader()
        const defaultUniforms = {
            ...compute.uniforms,
            time: state.current.time ?? { value: 0 },
            hot: { value: hsl('#ff2e69') },
            cold: { value: hsl('#0ffbff') },
            scale: { value: scale },
            offset: { value: offset },
            opacity: { value: 1 },
            curve_o: { value: contact ? 1 : 2 },
            curve_k: { value: contact ? 5 : 1 },
            curve_phase: { value: 0.5 },
            curve_harmonics: { value: contact ? 31 : 1 },
            texture: { value: compute.texture },
        }
        const anyUniforms = defaultUniforms as ShaderUniforms

        if (mainUniforms) {
            for (const [name, uniform] of Object.entries(mainUniforms)) {
                if (uniform) {
                    anyUniforms[name] = uniform
                }
            }
        }

        if (uniforms) {
            for (const [name, uniform] of Object.entries(uniforms)) {
                if (uniform) {
                    anyUniforms[name] = uniform
                }
            }
        }

        return {
            wireframe: false,
            uniforms: anyUniforms as U & typeof defaultUniforms,
            vertexShader: `
                varying vec2 vUv;
        
                void main() {
                    vUv = uv;
    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision mediump float;

                uniform vec3 hot;
                uniform vec3 cold;
                uniform float time;
                uniform float scale;
                uniform float offset;
                uniform float opacity;
                uniform float curve_o;
                uniform float curve_k;
                uniform float curve_phase;
                uniform float curve_harmonics;
            
                varying vec2 vUv;
                
                #define PI 3.1415926535897932384626433832795

                float testCurve(float x) {
                    float curve = 0.0; 
                    float scale = 0.5;
                    float offset = 1.0;
                    float o_pi = PI * curve_o;
                    float dx = -curve_k * (time / 15.0);
                    float pi_half = PI / 2.0;
                    float axis = x + curve_phase;
                    bool square = curve_harmonics > 1.0;
                    bool initial = time <= 1.0 / 1024.0 && curve_phase == 0.5;
                    
                    if (initial && square) {
                        curve = x < 0.5 ? 1.0 : -1.0;
                    } else {
                        float amp = square ? (4.0 / PI - 1.0) + 1.0 : 1.0;

                        for(float i = 1.0; i <= 128.0; i += 2.0) {
                            if (i > curve_harmonics) {
                                break;
                            }

                            float o = o_pi * i;
                            float wave = cos((o * axis) - pi_half) * exp(dx * o * o);
    
                            curve += wave * (1.0 / i) * amp;
                        }
                    }

                    return (offset + curve) * scale;
                }
    
                vec3 hsvlerp(in vec3 hsv1, in vec3 hsv2, in float rate) {
                    float hue = (mod(mod((hsv2.x - hsv1.x), 1.0) + 1.5, 1.0) - 0.5) * rate + hsv1.x;
                    vec3 hsv = vec3(hue, mix(hsv1.yz, hsv2.yz, rate));
                    vec3 rgb = clamp(abs(mod(hsv.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    
                    return hsv.z * mix(vec3(1.0), rgb, hsv.y);
                }
    
                vec4 heatShade(float curve) {
                    float padding = 0.1;

                    return vec4(
                        hsvlerp(cold, hot, curve),
                        curve * (1.0 - padding * 2.0) + padding
                    );
                }
    
                vec4 heat(float axis) {
                    float x = (axis + offset) * scale;
                    float curve = testCurve(x);

                    return heatShade(curve);
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
}

const offset = 0.925

function animate(time: number, rewind: boolean) {
    if (!rewind) {
        return time
    } else if (time < offset) {
        return time / offset
    } else {
        return 1 - (time - offset) / (1 - offset)
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
