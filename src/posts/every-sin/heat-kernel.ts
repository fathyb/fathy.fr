import { Kernel } from './kernel'

const width = 512
const height = 512

export const HeatKernel = Kernel.create({
    width,
    height,
    uniforms: {
        omega: { value: 2 },
        phase: { value: 0.5 },
        harmonics: { value: 1 },
        conductivity: { value: 1 },
    },
    glsl: `
        precision highp float;
    
        varying vec2 vUv;
    
        uniform float omega;
        uniform float phase;
        uniform float conductivity;
        uniform float harmonics;
    
        float kernel() {
            const float pi = 3.1415926535897932384626433832795;
            const float pi_half = pi / 2.0;
            const float pi_phase = (4.0 / pi - 1.0) + 1.0;
            const float height = ${height.toFixed(1)};

            float x = omega > 0.0 ? (vUv.x - mod(omega / 4.0, 1.0)) / (omega / 2.0) : vUv.x;
            float time = floor(vUv.y * height) / height;
            float o_pi = pi * omega;
            float dx = -conductivity * (time / 15.0);
            float axis = x + phase;
            float curve = 0.0;
            float amp = harmonics > 1.0 ? pi_phase : 1.0;
    
            for (float i = 1.0; i <= harmonics; i += 2.0) {
                float o = o_pi * i;
                float wave = cos((o * axis) - pi_half) * exp(dx * o * o);
    
                curve += wave * (1.0 / i) * amp;
            }

            return curve;
        }
    `,
})
