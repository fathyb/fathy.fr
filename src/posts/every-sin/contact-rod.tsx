import { Box } from '@mui/material'
import { Group, Mesh } from 'three'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

import { HeatShaderModel, useHeatShader } from './heat-shader'
import { useLazy } from '../../hooks/use-lazy-ref'

export interface Props {
    cool?: boolean
    model?: HeatShaderModel
}

export default function ContactRod(props: Props) {
    return (
        <Box width="100%" height={250}>
            <Canvas>
                <Scene {...props} />
            </Canvas>
        </Box>
    )
}

function Scene({ cool, model }: Props) {
    const group = useRef<Group>(null)
    const top = useRef<Mesh>(null)
    const bottom = useRef<Mesh>(null)
    const shader = useHeatShader({ cool, model, delay: 0.1 })
    const shaders = useLazy(() => ({
        top: shader.extend({
            model,
            time: shader.time,
            scale: 0.5,
        }),
        bottom: shader.extend({
            model,
            time: shader.time,
            scale: 0.5,
            offset: 1,
        }),
    }))

    useFrame(() => {
        if (group.current) {
            group.current.rotation.y += 0.01
        }

        if (top.current) {
            if (shader.time.real < 0.1) {
                top.current.position.y = -5 - 2 + 2 * (shader.time.real / 0.1)
            } else {
                top.current.position.y = -5
            }
        }

        if (bottom.current) {
            if (shader.time.real < 0.1) {
                bottom.current.position.y = 5 + 2 - 2 * (shader.time.real / 0.1)
            } else {
                bottom.current.position.y = 5
            }
        }
    })

    return (
        <>
            <perspectiveCamera fov={45} position={[0, 0, -15]}>
                <group ref={group} rotation={[0, 0.25, 0.75]}>
                    <mesh ref={top} position={[0, -10, 0]}>
                        <cylinderGeometry args={[1, 1, 10, 64]} />
                        <shaderMaterial
                            attach="material-0"
                            args={[shaders.top]}
                        />
                        <shaderMaterial
                            attach="material-1"
                            args={[shader.bottomCap]}
                        />
                        <shaderMaterial
                            attach="material-2"
                            args={[shader.bottomCap]}
                        />
                    </mesh>
                    <mesh ref={bottom} position={[0, 10, 0]}>
                        <cylinderGeometry args={[1, 1, 10, 64]} />
                        <shaderMaterial
                            attach="material-0"
                            args={[shaders.bottom]}
                        />
                        <shaderMaterial
                            attach="material-1"
                            args={[shader.topCap]}
                        />
                        <shaderMaterial
                            attach="material-2"
                            args={[shader.topCap]}
                        />
                    </mesh>
                </group>
            </perspectiveCamera>
        </>
    )
}
