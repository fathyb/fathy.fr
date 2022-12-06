import { useHeatShader } from './heat-shader'

export function createWindingShader(
    shader: ReturnType<typeof useHeatShader>,
    {
        animateDraw = false,
        animateWinding = 0,
        main = 'void main() { gl_FragColor = winding(); }',
    } = {},
) {
    return shader.extend({
        uniforms: {
            animateDraw: { value: animateDraw },
            animateWinding: { value: animateWinding },
        },
        fragment: `
            uniform bool animateDraw;
            uniform float animateWinding;
            uniform float inputFrequency;
            uniform float windingFrequency;

            vec4 winding() {
                float winding = windingFrequency + time * animateWinding;
                float draw = winding * (animateDraw ? time : 1.0);
                float factor = inputFrequency / winding;

                vec2 point = vUv * 2.0 - 1.0;
                float distance = distance(vUv, vec2(0.5, 0.5)) * 2.0 * 1.5;
                float angle = atan(point.y, point.x) / pi;
                float x = 1.0 - (angle < 0.0 ? 2.0 + angle : angle) / 2.0;
                vec4 color = vec4(0.0, 0.0, 0.0, 0.0);

                for(float i = 0.0; i < 32.0; i++) {
                    float t = x + i;

                    if (t > draw) {
                        break;
                    }

                    float curve = curve(t * factor - 0.25, 0.0);
                    // float curve = sin((t * factor - 0.25) * pi * 2.0);
                    float plot = 1.0 - smoothstep(1.0 - abs(distance - curve), 1.0, 0.97);
                    vec4 next = plot * vec4(shade(curve).rgb, 0.9);

                    color = (1.0 - next.a) * color + next.a * next;
                }

                return color;
            }

            ${main}
        `,
    })
}
