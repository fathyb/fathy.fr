import { useThree } from '@react-three/fiber'
import { Color, Vector3, IUniform } from 'three'

import { useStatic } from '../../hooks/use-static'
import { useThreeFrame } from '../../hooks/use-three-frame'

import { HeatKernel } from './heat-kernel'
import { KernelUniform } from './kernel'

export type HeatShaderModel = 'middle' | 'simple' | 'contact'
export type ShaderUniforms = Record<string, undefined | IUniform>

export interface HeatShaderProps {
    cool?: boolean
    delay?: number
    duration?: number
    rewind?: boolean | number
    fragment?: string
    uniforms?: ShaderUniforms
    model?: HeatShaderModel
    heatKernelWidth?: number
    heatKernelHeight?: number
}

export function useHeatShader({
    cool,
    model,
    fragment,
    uniforms: mainUniforms,
    delay = 0,
    rewind = true,
    duration = 5000,
    heatKernelWidth = 256,
    heatKernelHeight = model === 'contact' ? 512 : 8,
}: HeatShaderProps) {
    const { gl } = useThree()
    const state = useStatic(() => ({
        rewind: false,
        time: { value: 0, real: 0 },
    }))
    const shaders = useStatic(initState)

    useThreeFrame((time) => {
        shaders.compute.render(gl)

        if (!cool) {
            return
        }

        if (!rewind) {
            state.time.real = state.time.value = (time % 2_500) / 2_500

            return
        }

        const value = animate((time % duration) / duration, rewind)

        state.time.real = value
        state.time.value = Math.max(0, (value - delay) / (1 - delay))

        if (state.time.value <= 0) {
            state.rewind = false
        } else if (state.time.value >= 1) {
            state.rewind = true
        }

        return true
    })

    return shaders

    function initState() {
        const compute = new HeatKernel(heatKernelWidth, heatKernelHeight)

        if (model === 'contact') {
            compute.uniforms.omega.value = 1
            compute.uniforms.harmonics.value = 31
            compute.uniforms.conductivity.value = 3
        }

        if (mainUniforms) {
            const { uniforms } = compute

            for (const [name, uniform] of Object.entries(mainUniforms)) {
                if (uniform && name in uniforms) {
                    uniforms[name as keyof typeof uniforms] = uniform
                }
            }
        }

        return {
            extend,
            compute,
            time: state.time,
            main: extend({ fragment }),
            hotCap: extend({
                fragment: `
                    void main() {
                        gl_FragColor = vec4(heat(1.0).rgb, 1.0);
                    }
                `,
            }),
            coldCap: extend({
                fragment: `
                    void main() {
                        gl_FragColor = vec4(heat(0.0).rgb, 1.0);
                    }
                `,
            }),
        }

        function extend<U extends Record<string, IUniform>>({
            fragment,
            uniforms,
        }: {
            fragment?: string
            uniforms?: U
        }) {
            const defaultUniforms = {
                time: state.time,
                hot: { value: hsl('#ff2e69') },
                cold: { value: hsl('#0ffbff') },
                omega: compute.uniforms.omega,
                scale: { value: 1 },
                offset: { value: model === 'contact' ? 0.25 : 0 },
                diffusion: { value: compute.texture },
                selectDepth: { value: -1 },
                phaseAnimation: { value: 0 },
                initialSquare: { value: false },
            }
            const anyUniforms = defaultUniforms as ShaderUniforms

            if (model === 'contact') {
                defaultUniforms.initialSquare.value = true
            }

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
                uniforms: anyUniforms as U & typeof defaultUniforms,
                vertexShader: `
                    varying vec2 vUv;
            
                    void main() {
                        vUv = uv;
        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 hot;
                    uniform vec3 cold;
                    uniform float time;
                    uniform float omega;
                    uniform float scale;
                    uniform float offset;
                    uniform float selectDepth;
                    uniform float phaseAnimation;
                    uniform bool initialSquare;
                    uniform sampler2D diffusion;
                
                    varying vec2 vUv;

                    const float pi = 3.1415926535897932384626433832795;

                    float getOpacity() {
                        if (selectDepth > time && phaseAnimation == 0.0) {
                            return 0.0;
                        }

                        if (selectDepth <= 0.0){
                            return 1.0;
                        }

                        return (
                            0.75 + (sin(pi * 12.0 * selectDepth - time * pi * 2.0) + 1.0) * 0.25
                        ) * (0.6 + (1.0 - selectDepth) * 0.4);
                    }

                    float getBrightness() {
                        if (selectDepth > time && phaseAnimation == 0.0) {
                            return 0.0;
                        }

                        if (selectDepth <= 0.0){
                            return 0.0;
                        }

                        return (sin(pi * 7.0 * selectDepth - time * pi * 2.0) + 1.0) * 0.1;
                    }

                    vec3 hsvlerp(in vec3 hsv1, in vec3 hsv2, in float rate) {
                        float hue = (mod(mod((hsv2.x - hsv1.x), 1.0) + 1.5, 1.0) - 0.5) * rate + hsv1.x;
                        vec3 hsv = vec3(hue, mix(hsv1.yz, hsv2.yz, rate));
                        vec3 rgb = clamp(abs(mod(hsv.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        
                        return hsv.z * mix(vec3(1.0), rgb, hsv.y);
                    }
        
                    vec4 shade(float curve) {
                        float padding = 0.1;
    
                        return vec4(
                            hsvlerp(cold, hot, curve) + 1.0 * getBrightness(),
                            curve * (1.0 - padding * 2.0) + padding
                        );
                    }

                    float unpack(vec4 color) {
                        const vec4 shift = vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);

                        return dot(color, shift) * 4.0 - 2.0;
                    }
        
                    float curve(float x, float t) {
                        float y = selectDepth < 0.0 ? t : selectDepth;
                        float base = x / scale * omega / 2.0 + offset;
                        
                        return initialSquare && y == 0.0
                            ? mod(base, 1.0) < 0.5 ? 1.0 : 0.0
                            : (
                                unpack(texture2D(diffusion, vec2(mod(base + phaseAnimation * t, 1.0), y))) + 1.0
                            ) / 2.0;
                    }
        
                    vec4 heat(float x) {
                        return shade(curve(x, time));
                    }
        
                    ${
                        fragment ??
                        `
                            void main() {
                                gl_FragColor = vec4(heat(vUv.y).rgb, getOpacity());
                            }
                        `
                    }
                `,
            }
        }
    }
}

function animate(time: number, rewind: boolean | number) {
    if (!rewind) {
        return time
    } else {
        if (typeof rewind === 'boolean') {
            rewind = 0.075
        }

        const offset = 1 - rewind

        if (time < offset) {
            return time / offset
        } else {
            return 1 - (time - offset) / (1 - offset)
        }
    }
}

console.log('hot', hsl('#ff2e69'))
console.log('cold', hsl('#0ffbff'))

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
