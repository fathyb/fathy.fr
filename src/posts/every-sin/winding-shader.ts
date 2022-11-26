import { useHeatShader } from './heat-shader'

export function createWindingShader(shader: ReturnType<typeof useHeatShader>) {
    return shader.extend({
        fragment: `
            uniform float inputFrequency;
            uniform float windingFrequency;

            void main() {
                float draw = windingFrequency * time;
                float factor = inputFrequency / windingFrequency;

                vec2 point = vUv * 2.0 - 1.0;
                float distance = distance(vUv, vec2(0.5, 0.5)) * 2.0 * 1.5;
                float angle = atan(point.y, point.x) / pi;
                float x = 1.0 - (angle < 0.0 ? 2.0 + angle : angle) / 2.0;
                vec4 color = vec4(0.0, 0.0, 0.0, 0.0);

                for(float t = x; t < draw; t += 1.0) {
                    float curve = curve(t * factor - 0.25, 0.0);
                    float plot = 1.0 - smoothstep(1.0 - abs(distance - curve), 1.0, 0.97);
                    vec4 next = plot * vec4(shade(curve).rgb, 1.0);

                    color = (1.0 - next.a) * color + next.a * next;
                }

                gl_FragColor = color;
            }
        `,
    })
}
