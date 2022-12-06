import { Texture, WebGLRenderer } from 'three'

import { Kernel } from './kernel'

const width = 512
const height = 8

export class WindingCenterKernel extends Kernel.create({
    width,
    height,
    uniforms: {
        diffusion: { value: null as null | Texture },
        animateWinding: { value: 10 },
        inputFrequency: { value: 3 },
        windingFrequency: { value: 10 },
    },
    glsl: `
        uniform sampler2D diffusion;
        uniform float animateWinding;
        uniform float inputFrequency;
        uniform float windingFrequency;

        float kernel() {
            const vec4 shift = vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);
            const float pi = 3.1415926535897932384626433832795;
            const float samples = 64.0;

            float winding = windingFrequency + vUv.x * animateWinding;
            float factor = inputFrequency / winding;
            float phase = vUv.y < .5 ? pi / 2.0 : 0.0;
            float center = 0.0;
            float divider = 0.0;
            float angles = min(1.0, winding);

            for (float i = 0.0; i < samples; i += 1.0) {
                float angle = i / samples * angles;

                for (float t = angle; t < winding; t += 1.0) {
                    float value = (
                        (
                            dot(
                                texture2D(diffusion, vec2(mod(t * factor - 0.25, 1.0), 0.0)),
                                shift
                            ) * 4.0 - 2.0
                        ) + 1.0
                    ) / 2.0 + 0.1;

                    center += value * sin(angle * pi * 2.0 + phase);
                    divider++;
                }
            }
            
            return center / max(1.0, divider);
        }
    `,
}) {
    constructor(private readonly heat: Kernel) {
        super()

        this.uniforms.diffusion.value = heat.texture
    }

    public render(gl: WebGLRenderer) {
        if (this.heat.render(gl)) {
            this.needsUpdate = true
        }

        return super.render(gl)
    }
}
