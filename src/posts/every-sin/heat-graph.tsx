import { Box } from '@mui/material'
import { OrthographicCamera } from 'three'

import { useStatic } from '../../hooks/use-static'
import { SharedCanvas } from './shared-renderer'
import { HeatShaderModel, ShaderUniforms, useHeatShader } from './heat-shader'

export interface Props {
    cool?: boolean
    delay?: number
    model?: HeatShaderModel
    uniforms?: ShaderUniforms
}

export default function HeatGraph(props: Props) {
    const camera = useStatic(() => {
        const camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1)

        camera.zoom = 40
        camera.position.set(0, 0, 0)

        return camera
    })

    return (
        <Box width="100%" height={250}>
            <SharedCanvas camera={camera}>
                <Scene {...props} />
            </SharedCanvas>
        </Box>
    )
}

function Scene({ cool, model, delay, uniforms }: Props) {
    const shader = useHeatShader({
        cool,
        model,
        delay,
        uniforms,
        fragment: `
            void main() {
                vec4 curve = heat(vUv.x);
                float shape = smoothstep(
                    1.0 - clamp(distance(0.925 * (1.0 - curve.w) + vUv.y - 0.45, 0.5) * 1.0, 0.0, 1.0),
                    1.0,
                    0.99
                );

                gl_FragColor = (1.0 - shape) * vec4(curve.rgb, 1.0);
            }
        `,
    })

    return (
        <mesh position={[0, 0, 0]}>
            <planeGeometry args={[10, 6]} />
            <shaderMaterial args={[shader.main]} />
        </mesh>
    )
}
