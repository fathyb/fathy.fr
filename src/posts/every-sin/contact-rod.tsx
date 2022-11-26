import { Box } from '@mui/material'
import { useRef } from 'react'
import { Group, Mesh } from 'three'

import { useStatic } from '../../hooks/use-static'
import { useThreeFrame } from '../../hooks/use-three-frame'
import { SharedCanvas } from './shared-renderer'
import { HeatShaderModel, ShaderUniforms, useHeatShader } from './heat-shader'

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
    const cold = useRef<Mesh>(null)
    const hot = useRef<Mesh>(null)
    const shader = useHeatShader({ cool, model, delay, uniforms })
    const shaders = useStatic(() => ({
        cold: shader.extend({
            uniforms: {
                scale: { value: 2 },
                offset: { value: 0.25 },
            },
        }),
        hot: shader.extend({
            uniforms: {
                scale: { value: 2 },
                offset: { value: 0.5 },
            },
        }),
    }))

    useThreeFrame((time) => {
        if (group.current) {
            group.current.rotation.y = ((time % 7500) / 7500) * Math.PI * 2
        }

        if (cold.current) {
            if (shader.time.real < delay) {
                cold.current.position.y =
                    -5 - 5 + 5 * (shader.time.real / delay)
            } else {
                cold.current.position.y = -5
            }
        }

        if (hot.current) {
            if (shader.time.real < delay) {
                hot.current.position.y = 5 + 5 - 5 * (shader.time.real / delay)
            } else {
                hot.current.position.y = 5
            }
        }

        return true
    })

    return (
        <>
            <perspectiveCamera fov={45} position={[0, 0, -15]}>
                <group ref={group} rotation={[0, 0.25, 0.75]}>
                    <mesh ref={cold} position={[0, -10, 0]} visible={true}>
                        <cylinderGeometry args={[1, 1, 10, 64]} />
                        <shaderMaterial
                            attach="material-0"
                            args={[shaders.cold]}
                        />
                        <shaderMaterial
                            attach="material-1"
                            args={[shader.coldCap]}
                        />
                        <shaderMaterial
                            attach="material-2"
                            args={[shader.coldCap]}
                        />
                    </mesh>
                    <mesh ref={hot} position={[0, 10, 0]}>
                        <cylinderGeometry args={[1, 1, 10, 64]} />
                        <shaderMaterial
                            attach="material-0"
                            args={[shaders.hot]}
                        />
                        <shaderMaterial
                            attach="material-1"
                            args={[shader.hotCap]}
                        />
                        <shaderMaterial
                            attach="material-2"
                            args={[shader.hotCap]}
                        />
                    </mesh>
                </group>
            </perspectiveCamera>
        </>
    )
}
