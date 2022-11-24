import { Box, Slider, Typography } from '@mui/material'
import { Fragment, useRef, useState } from 'react'
import { Group, IUniform, Mesh, PerspectiveCamera } from 'three'

import { useStatic } from '../../hooks/use-static'
import { useThreeFrame } from '../../hooks/use-three-frame'
import { SharedCanvas } from './shared-renderer'
import { HeatShaderModel, useHeatShader } from './heat-shader'
import HeatGraph from './heat-graph'
import ContactRod from './contact-rod'

export interface Props {
    camera: PerspectiveCamera
    delay?: number
    model?: HeatShaderModel
    toolbox?: boolean
    harmonics?: boolean
    o?: number
    k?: number
}

export default function HeatGraph3D(props: Omit<Props, 'camera'>) {
    const camera = useStatic(() => new PerspectiveCamera(45))
    const [uniforms, setUniforms] = useState(() => {
        const defaultUniforms = {
            curve_o: {
                max: 10,
                name: 'ω',
                desc: 'angle in radians',
                value: props.o ?? (props.model === 'contact' ? 1 : 2),
                angle: true,
            },
            curve_k: {
                max: 8,
                name: 'k',
                desc: 'how fast heat propagates',
                value: props.k ?? (props.model === 'contact' ? 5 : 1),
            },
        }

        return props.harmonics
            ? {
                  ...defaultUniforms,
                  curve_harmonics: {
                      min: 1,
                      max: 128,
                      step: 1,
                      name: 'h',
                      desc: 'how many harmonics',
                      value: 31,
                      map: (v: number) => (v % 2 === 0 && v > 0 ? v - 1 : v),
                  },
              }
            : defaultUniforms
    })
    const change =
        (key: keyof typeof uniforms) =>
        (_: unknown, value: number[] | number) => {
            if (typeof value === 'number') {
                const uniform = uniforms[key]

                uniform.value = value

                setUniforms({ ...uniforms, [key]: uniform })
            }
        }

    return (
        <>
            {'curve_harmonics' in uniforms ? (
                <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="center"
                >
                    <ContactRod
                        cool
                        delay={0.2}
                        model={props.model}
                        uniforms={uniforms}
                    />
                    <HeatGraph
                        cool
                        delay={0.2}
                        model={props.model}
                        uniforms={uniforms}
                    />
                </Box>
            ) : null}
            <Box
                width="100%"
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
            >
                {props.toolbox ? (
                    <Box flex={1}>
                        {Object.entries(uniforms).map(([key, uniform]) => (
                            <Fragment key={key}>
                                <Box
                                    px={2}
                                    display="flex"
                                    flexDirection="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <Typography
                                        variant="body1"
                                        component="span"
                                    >
                                        <Typography component="code">
                                            {'name' in uniform
                                                ? uniform.name
                                                : key}
                                        </Typography>
                                        : {uniform.desc}
                                    </Typography>
                                    <Box>
                                        <Typography
                                            variant="body1"
                                            component="span"
                                        >
                                            {Math.round(
                                                ('map' in uniform
                                                    ? uniform.map(uniform.value)
                                                    : uniform.value) * 100,
                                            ) / 100}
                                            {'angle' in uniform &&
                                            uniform.angle ? (
                                                <Typography component="code">
                                                    &nbsp;* π
                                                </Typography>
                                            ) : null}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Slider
                                    min={0}
                                    max={uniform.max}
                                    step={
                                        'step' in uniform ? uniform.step : 0.01
                                    }
                                    value={uniform.value}
                                    onChange={change(
                                        key as keyof typeof uniforms,
                                    )}
                                />
                            </Fragment>
                        ))}
                    </Box>
                ) : null}
                <Box height={300} flex={1}>
                    <SharedCanvas camera={camera}>
                        <Scene camera={camera} uniforms={uniforms} {...props} />
                    </SharedCanvas>
                </Box>
            </Box>
        </>
    )
}

function Scene({
    camera,
    model,
    delay,
    toolbox,
    uniforms,
}: Props & { uniforms: Record<string, IUniform> }) {
    const mesh = useRef<Mesh>(null)
    const group = useRef<Group>(null)
    const shader = useHeatShader({
        model,
        delay,
        fragment,
        uniforms,
        cool: true,
        rewind: !toolbox,
    })
    const resolution = 16
    const shaders = useStatic(() =>
        Array(resolution)
            .fill(0)
            .map((_, i) =>
                shader.extend({
                    fragment,
                    uniforms: {
                        time: { value: i * (1 / resolution) },
                    },
                }),
            ),
    )

    useThreeFrame(() => {
        if (group.current) {
            const time = toolbox ? 1 : shader.time.real
            const angle = time * Math.PI

            group.current.rotation.y = 1.5 + -angle / 3
        }

        if (mesh.current) {
            const time = toolbox ? 0 : shader.time.value

            mesh.current.position.z = time * -15
        }

        for (let i = 0; i < shaders.length; i++) {
            const { uniforms } = shaders[i]

            if (toolbox) {
                uniforms.curve_phase.value = shader.time.value * (1 / Math.PI)
            }

            if (toolbox || uniforms.time.value <= shader.time.value) {
                uniforms.opacity.value =
                    (1 - (i + 1) / shaders.length) * (i % 2 === 0 ? 1 : 0.5)
            } else {
                uniforms.opacity.value = 0
            }
        }

        camera.lookAt(0, 0, -5)
        camera.position.set(15, 5, 2)

        return true
    })

    return (
        <group ref={group} position={[0, 0, -5]}>
            {toolbox ? null : (
                <mesh ref={mesh}>
                    <planeGeometry args={[10, 7]} />
                    <shaderMaterial args={[shader.main]} transparent />
                </mesh>
            )}
            {shaders.map((shader, i) => (
                <mesh
                    key={i}
                    position={[0, 0, shader.uniforms.time.value * -15]}
                >
                    <planeGeometry args={[10, 7]} />
                    <shaderMaterial args={[shader]} transparent />
                </mesh>
            ))}
        </group>
    )
}

const fragment = `
    void main() {
        vec4 value = heat(vUv.x);
        float shape = smoothstep(
            1.0 - clamp(distance(0.925 * (1.0 - value.w) + vUv.y - 0.45, 0.5) * 1.0, 0.0, 1.0),
            1.0,
            0.99
        );

        gl_FragColor = (1.0 - shape) * vec4(value.rgb, 1.0 * opacity);
    }
`
