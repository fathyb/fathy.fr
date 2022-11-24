import { Box } from '@mui/material'
import { Mesh } from 'three'
import { useRef } from 'react'

import { useThreeFrame } from '../../hooks/use-three-frame'
import { SharedCanvas } from './shared-renderer'
import { HeatShaderModel, ShaderUniforms, useHeatShader } from './heat-shader'

export interface Props {
    cool?: boolean
    model?: HeatShaderModel
    uniforms?: ShaderUniforms
}

export default function GlowingRod(props: Props) {
    return (
        <Box width="100%" height={250}>
            <SharedCanvas>
                <Scene {...props} />
            </SharedCanvas>
        </Box>
    )
}

function Scene({ cool, model, uniforms }: Props) {
    const mesh = useRef<Mesh>(null)
    const shader = useHeatShader({
        cool,
        model,
        uniforms,
    })

    useThreeFrame((time) => {
        if (mesh.current) {
            mesh.current.rotation.y = ((time % 7500) / 7500) * Math.PI * 2

            return true
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
