import { useEffect, useRef, useState } from 'react'
import { Box, Slider, Typography, useTheme } from '@mui/material'
import { Group, IUniform, DoubleSide, PerspectiveCamera } from 'three'

import { useStatic } from '../../hooks/use-static'
import { useThreeFrame } from '../../hooks/use-three-frame'

import { SharedCanvas } from './shared-renderer'
import { useHeatShader } from './heat-shader'
import { createWindingShader } from './winding-shader'

export default function WindingGraph3D({ toolbox = false } = {}) {
    const camera = useStatic(() => new PerspectiveCamera(20))
    const [uniforms, setUniforms] = useState(() => ({
        harmonics: { value: 1 },
        inputFrequency: { value: 7 },
        windingFrequency: { value: 4.0 },
    }))

    return (
        <Box
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            flexWrap="wrap"
        >
            {toolbox ? (
                <Box flex={1} p={2} minWidth="50%">
                    <Typography variant="body1">Rotation speed</Typography>
                    <Slider
                        min={1}
                        max={12}
                        step={0.001}
                        value={uniforms.windingFrequency.value}
                        onChange={(_e, value) => {
                            if (typeof value === 'number') {
                                setUniforms((u) => {
                                    u.windingFrequency.value = value

                                    return { ...u }
                                })
                            }
                        }}
                    />
                </Box>
            ) : null}
            <Box flex={1} height={250} position="relative">
                <SharedCanvas camera={camera}>
                    <Scene camera={camera} uniforms={uniforms} />
                </SharedCanvas>
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,

                        perspective: 20,
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,

                            pointerEvents: 'none',
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                                transform:
                                    'translate3d(50%,50%,-11px) rotateZ(360deg)',
                            }}
                        ></h2>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

function Scene({
    camera,
    uniforms,
}: {
    camera: PerspectiveCamera
    uniforms: {
        inputFrequency: IUniform
        windingFrequency: IUniform
    }
}) {
    const winding = useRef<Group>(null)
    const shader = useHeatShader({
        uniforms,
        cool: true,
        rewind: 0.025,
        duration: 15_000,
    })
    const shaders = useStatic(() => ({
        winding: createWindingShader(shader, { animateDraw: true }),
        circle: shader.extend({
            fragment: `
                void main() {
                    const float stroke = 0.02;
                    const float outerRadius = 0.8;
                    const float innerRadius = outerRadius - stroke;
                    float d = length(vUv * 2.0 - 1.0);
                    float w = fwidth(d) * 0.75;
                    vec2 point = vUv * 2.0 - 1.0;
                    float distance = distance(vUv, vec2(0.5, 0.5)) * 2.0 * 1.5;
                    float angle = atan(point.y, point.x) / pi;
                    float x = 1.0 - (angle < 0.0 ? 2.0 + angle : angle) / 2.0;
                    float gradient = (sin(x * pi * 5.0 * 2.0) + 1.0) / 2.0 * 0.15 + 0.1;
                    vec3 shade = shade(gradient).rgb;

                    gl_FragColor = mix(
                        vec4(shade, 1.0),
                        vec4(shade, 0.0),
                        smoothstep(innerRadius + w, innerRadius - w, d)
                    ) * smoothstep(outerRadius + w, outerRadius - w, d);
                }
            `,
        }),
        graph: shader.extend({
            fragment: `
                uniform float inputFrequency;

                void main() {
                    const float fade = .8;
                    const float peaks = 4.0;
                    vec4 curve = shade(curve((vUv.x * peaks / inputFrequency - time) * inputFrequency - 0.25, 0.0));
                    float shape = smoothstep(
                        1.0 - clamp(distance((1.0 - curve.w) * 0.925 + vUv.y - 0.5, 0.45) * 1.0, 0.0, 1.0),
                        1.0,
                        0.975
                    );

                    gl_FragColor = (1.0 - shape) * vec4(
                        curve.rgb,
                        (1.0 - clamp((vUv.x - fade) / (1.0 - fade), 0.0, 1.0)) * 0.9
                    );
                }
            `,
        }),
    }))

    useEffect(() => {
        camera.position.set(-25, 8, 15)
        camera.lookAt(0, 0, 0)
    }, [])

    useThreeFrame(() => {
        if (winding.current) {
            winding.current.rotation.z =
                (shader.time.value * uniforms.windingFrequency.value + 0.25) *
                Math.PI *
                2
        }

        return true
    })

    const height = 4.285
    const margin = height - height * 0.975
    const y = height / 2 - margin - 0.25

    return (
        <group position={[0, 0, 0]}>
            <group ref={winding} position={[0, 0, -5]}>
                <mesh>
                    <planeGeometry args={[10, 10]} />
                    <shaderMaterial
                        transparent
                        side={DoubleSide}
                        args={[shaders.winding]}
                    />
                </mesh>
                <mesh>
                    <planeGeometry args={[12.5, 12.5]} />
                    <shaderMaterial
                        transparent
                        side={DoubleSide}
                        args={[shaders.circle]}
                    />
                </mesh>
            </group>
            <mesh position={[0, y, 1.25]} rotation={[0, -Math.PI * 0.5, 0]}>
                <planeGeometry args={[12.5, height]} />
                <shaderMaterial
                    transparent
                    side={DoubleSide}
                    args={[shaders.graph]}
                />
            </mesh>
        </group>
    )
}
