import { Box } from '@mui/material'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Group, Mesh, PerspectiveCamera } from 'three'

import { useLazy } from '../../hooks/use-lazy-ref'
import { HeatShaderModel, useHeatShader } from './heat-shader'

export interface Props {
    delay?: number
    model?: HeatShaderModel
    camera: PerspectiveCamera
}

export default function ThreeDeeHeatGraph(props: Omit<Props, 'camera'>) {
    const camera = useLazy(() => new PerspectiveCamera(45))

    return (
        <Box width="100%" height={250}>
            <Canvas camera={camera} flat>
                <Scene camera={camera} {...props} />
            </Canvas>
        </Box>
    )
}

function Scene({ camera, model, delay }: Props) {
    const mesh = useRef<Mesh>(null)
    const group = useRef<Group>(null)
    const shader = useHeatShader({
        cool: true,
        model,
        delay,
        fragment,
    })
    const resolution = 35
    const shaders = useLazy(() =>
        Array(resolution)
            .fill(0)
            .map((_, i) =>
                shader.extend({
                    model,
                    fragment,
                    time: { value: i * (1 / resolution) },
                }),
            ),
    )

    useFrame(() => {
        if (group.current) {
            const angle = shader.time.real * Math.PI

            group.current.rotation.y = 1.5 + -angle / 3
            //group.current.rotation.z = angle / 8
            //group.current.rotation.x = angle / 10
        }

        if (mesh.current) {
            mesh.current.position.z = shader.time.value * -15
        }

        for (let i = 0; i < shaders.length; i++) {
            const { uniforms } = shaders[i]

            if (uniforms.time.value <= shader.time.value) {
                uniforms.opacity.value = i % 4 === 0 ? 1 : 0.5
            } else {
                uniforms.opacity.value = 0
            }
        }

        camera.lookAt(0, 0, -5)
        camera.position.set(15, 5, 2)
    })

    return (
        <group ref={group} position={[0, 0, -5]}>
            <mesh ref={mesh}>
                <planeGeometry args={[10, 6]} />
                <shaderMaterial args={[shader.main]} transparent />
            </mesh>
            {shaders.map((shader, i) => (
                <mesh
                    key={i}
                    position={[0, 0, shader.uniforms.time.value * -15]}
                >
                    <planeGeometry args={[10, 6]} />
                    <shaderMaterial args={[shader]} transparent />
                </mesh>
            ))}
        </group>
    )
}

const fragment = `
    void main() {
        vec4 curve = heat(vUv.x);
        float shape = smoothstep(
            1.0 - clamp(distance(0.925 * (1.0 - curve.w) + vUv.y-0.45, 0.5) * 1.0, 0.0, 1.0),
            1.0,
            0.99
        );

        gl_FragColor = (1.0 - shape) * vec4(curve.rgb, 1.0 * opacity);
    }
`
