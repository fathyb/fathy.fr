import { Box } from '@mui/material'
import { Canvas } from '@react-three/fiber'

import { HeatShaderModel, useHeatShader } from './heat-shader'

export interface Props {
    cool?: boolean
    delay?: number
    model?: HeatShaderModel
}

export default function HeatGraph(props: Props) {
    return (
        <Box width="100%" height={250}>
            <Canvas>
                <Scene {...props} />
            </Canvas>
        </Box>
    )
}

function Scene({ cool, model, delay }: Props) {
    const shader = useHeatShader({
        cool,
        model,
        delay,
        fragment: `
            void main() {
                vec4 curve = heat(vUv.x);
                float shape = smoothstep(
                    1.0 - clamp(distance(0.925 * (1.0 - curve.w) + vUv.y-0.45, 0.5) * 1.0, 0.0, 1.0),
                    1.0,
                    0.99
                );

                gl_FragColor = (1.0 - shape) * vec4(curve.rgb, 1.0);
            }
        `,
    })

    return (
        <>
            <perspectiveCamera fov={45} position={[0, 0, 0]}>
                <mesh>
                    <planeGeometry args={[10, 6]} />
                    <shaderMaterial args={[shader.main]} />
                </mesh>
            </perspectiveCamera>
        </>
    )
}
