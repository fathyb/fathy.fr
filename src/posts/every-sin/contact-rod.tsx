import { Box } from '@mui/material'
import { useRef } from 'react'
import { Group, Mesh } from 'three'

import { useStatic } from '../../hooks/use-static'
import { useThreeFrame } from '../../hooks/use-three-frame'
import { HeatShaderModel, ShaderUniforms, useHeatShader } from './heat-shader'
import { SharedCanvas } from './shared-renderer'

export interface Props {
    cool?: boolean
    delay?: number
    model?: HeatShaderModel
    uniforms?: ShaderUniforms
}

export default function ContactRod(props: Props) {
    return (
        <Box width="100%" height={250}>
            <SharedCanvas depth>
                <Scene {...props} />
            </SharedCanvas>
        </Box>
    )
}

function Scene({ cool, model, uniforms, delay = 0.2 }: Props) {
    const group = useRef<Group>(null)
    const top = useRef<Mesh>(null)
    const bottom = useRef<Mesh>(null)
    const shader = useHeatShader({ cool, model, delay, uniforms })
    const shaders = useStatic(() => ({
        top: shader.extend({
            scale: 0.5,
        }),
        bottom: shader.extend({
            scale: 0.5,
            offset: 1,
        }),
    }))

    useThreeFrame((time) => {
        if (group.current) {
            group.current.rotation.y = ((time % 7500) / 7500) * Math.PI * 2
        }

        if (top.current) {
            if (shader.time.real < delay) {
                top.current.position.y = -5 - 5 + 5 * (shader.time.real / delay)
            } else {
                top.current.position.y = -5
            }
        }

        if (bottom.current) {
            if (shader.time.real < delay) {
                bottom.current.position.y =
                    5 + 5 - 5 * (shader.time.real / delay)
            } else {
                bottom.current.position.y = 5
            }
        }

        return true
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
