import { Box } from '@mui/material'
import { Mesh } from 'three'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

import { HeatShaderModel, useHeatShader } from './heat-shader'

export interface Props {
    cool?: boolean
    model?: HeatShaderModel
}

export default function GlowingRod(props: Props) {
    return (
        <Box width="100%" height={250}>
            <Canvas>
                <Scene {...props} />
            </Canvas>
        </Box>
    )
}

function Scene({ cool, model }: Props) {
    const mesh = useRef<Mesh>(null)
    const shader = useHeatShader({ cool, model })

    useFrame(() => {
        if (mesh.current) {
            mesh.current.rotation.y += 0.01
        }
    })

    return (
        <>
            <perspectiveCamera fov={45} position={[0, 0, -15]}>
                <mesh ref={mesh} rotation={[0, 0.25, 0.75]}>
                    <cylinderGeometry args={[1, 1, 20, 64]} />
                    <shaderMaterial attach="material-0" args={[shader.main]} />
                    <shaderMaterial
                        attach="material-1"
                        args={[shader.topCap]}
                    />
                    <shaderMaterial
                        attach="material-2"
                        args={[shader.bottomCap]}
                    />
                </mesh>
            </perspectiveCamera>
        </>
    )
}
