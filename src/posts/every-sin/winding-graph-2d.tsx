import { Box, Slider, Typography } from '@mui/material'
import { useThree } from '@react-three/fiber'
import { IUniform, Mesh, OrthographicCamera } from 'three'
import {
    Fragment,
    MutableRefObject,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react'

import { useStatic } from '../../hooks/use-static'
import { useThreeFrame } from '../../hooks/use-three-frame'
import { useVisibilityCheck } from '../../hooks/use-visibility-check'

import { SharedCanvas } from './shared-renderer'
import { useHeatShader } from './heat-shader'
import { createWindingShader } from './winding-shader'
import { findWindingCenter, WindingCenter } from './winding-center'

export interface Props {
    speed: number
    toolbox?: boolean
    harmonics?: number
}

export default function WindingGraph2D(props: Props) {
    const svgRef = useRef<SVGRectElement | null>(null)
    const [uniforms, setUniforms] = useState(() => ({
        harmonics: { value: props.harmonics ?? 1 },
        animateWinding: { value: props.speed },
        inputFrequency: { value: 4 },
        windingFrequency: { value: 0 },
    }))
    const camera = useStatic(() => {
        const camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1)

        camera.zoom = 30
        camera.position.set(0, 0, 0)

        return camera
    })
    const windingCenter = useMemo(() => {
        const { value: harmonics } = uniforms.harmonics

        return findWindingCenter({
            animateWinding: uniforms.animateWinding.value,
            inputFrequency: uniforms.inputFrequency.value,
            windingFrequency: uniforms.windingFrequency.value,
            function: (x) => {
                let curve = 0

                for (let i = 1; i <= harmonics; i += 2) {
                    curve += Math.sin(x * i) / i
                }

                if (harmonics > 1) {
                    return curve * (4.0 / Math.PI)
                } else {
                    return curve
                }
            },
        })
    }, [
        uniforms.harmonics.value,
        uniforms.inputFrequency.value,
        uniforms.animateWinding.value,
        uniforms.windingFrequency.value,
    ])

    return (
        <Box
            flex={1}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            flexWrap="wrap"
        >
            <Box
                width="100%"
                flex={1}
                display="flex"
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                flexWrap="wrap"
            >
                <Box mt={2} flex={1} height={250} position="relative">
                    <SharedCanvas camera={camera} depth>
                        <Scene
                            {...props}
                            svgRef={svgRef}
                            uniforms={uniforms}
                            windingCenter={windingCenter}
                        />
                    </SharedCanvas>
                </Box>
                <Box
                    mt={2}
                    flex={1}
                    sx={{ minWidth: 450, svg: { width: '100%' } }}
                >
                    <Graph
                        svgRef={svgRef}
                        windingCenter={windingCenter}
                        animateWinding={props.speed}
                        windingFrequency={uniforms.windingFrequency.value}
                    />
                </Box>
            </Box>
            {props.toolbox ? (
                <Box width="100%" flex={1} pt={2}>
                    <Typography variant="body1">Input frequency</Typography>
                    <Slider
                        min={1}
                        max={12}
                        step={0.001}
                        value={uniforms.inputFrequency.value}
                        onChange={(_e, value) => {
                            if (typeof value === 'number') {
                                setUniforms((u) => {
                                    u.inputFrequency.value = value

                                    return { ...u }
                                })
                            }
                        }}
                    />
                </Box>
            ) : null}
        </Box>
    )
}

function Scene({
    svgRef,
    speed,
    uniforms,
    windingCenter,
}: Props & {
    windingCenter: null | WindingCenter
    svgRef: MutableRefObject<SVGRectElement | null>
    uniforms: {
        harmonics: IUniform<number>
        inputFrequency: IUniform<number>
        windingFrequency: IUniform<number>
    }
}) {
    const visible = useVisibilityCheck(svgRef)
    const centerCircle = useRef<Mesh>(null)
    const shader = useHeatShader({
        uniforms,
        cool: true,
        rewind: 0.175,
        duration: 10_000,
        heatKernelWidth: uniforms.harmonics.value > 1 ? 1024 : 128,
    })
    const shaders = useStatic(() => ({
        winding: createWindingShader(shader, { animateWinding: speed }),
    }))

    useThreeFrame(() => {
        if (windingCenter && centerCircle.current) {
            const [x, y] = windingCenter.get(shader.time.value)

            centerCircle.current.position.x = x * 1.75
            centerCircle.current.position.y = y * 1.75
        }

        if (visible && svgRef.current) {
            svgRef.current.setAttribute(
                'width',
                `${Math.round(shader.time.value * 300)}px`,
            )
        }

        return true
    })

    return (
        <>
            <mesh renderOrder={0} position={[0, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <shaderMaterial args={[shaders.winding]} transparent />
            </mesh>
            <mesh renderOrder={1} position={[0, 0, 1]} ref={centerCircle}>
                <circleGeometry args={[0.25, 32]} />
                <meshBasicMaterial color={0xff0000} polygonOffset={true} />
            </mesh>
        </>
    )
}

function Graph({
    svgRef,
    animateWinding,
    windingFrequency,
    windingCenter,
}: {
    svgRef: MutableRefObject<SVGRectElement | null>
    animateWinding: number
    windingFrequency: number
    windingCenter: WindingCenter
}) {
    const id = useId().replace(/:/g, '')
    const meters = Math.min(21, animateWinding + 1)

    return (
        <svg viewBox="0 0 345 150">
            <defs>
                <linearGradient
                    id={`${id}-gradient`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop offset="0" stopColor="#e40625" />
                    <stop offset="0.14" stopColor="#e80580" />
                    <stop offset="0.28" stopColor="#ec04e0" />
                    <stop offset="0.42" stopColor="#9d04f0" />
                    <stop offset="0.57" stopColor="#3e03f4" />
                    <stop offset="0.71" stopColor="#0229f8" />
                    <stop offset="0.85" stopColor="#018efc" />
                    <stop offset="1" stopColor="#01f6ff" />
                </linearGradient>
                <clipPath id={`${id}-clip-left`}>
                    <rect ref={svgRef} x="0" y="0" width={0} height={180} />
                </clipPath>
                <marker
                    id={`${id}-arrow-head`}
                    refX="0"
                    refY="2.5"
                    markerWidth="6"
                    markerHeight="5"
                    orient="auto"
                >
                    <polygon points="0 0, 6 2.5, 0 5" fill="#495778" />
                </marker>
                <g id={`${id}-graph`}>
                    <path
                        d={windingCenter.curve}
                        fill="none"
                        stroke={`url(#${id}-gradient)`}
                        strokeWidth={2}
                    />
                </g>
                <g id={`${id}-graph-clipped`}>
                    <use
                        href={`#${id}-graph`}
                        clipPath={`url(#${id}-clip-left)`}
                    />
                </g>
            </defs>

            <g transform="translate(15, 15)">
                <text x={7} y={-5} fill="white" fontSize={8}>
                    horizontal position
                </text>
                <text x={250} y={65} fill="white" fontSize={8}>
                    rotation speed
                </text>
                {Array(meters)
                    .fill(0)
                    .map((_, i) => {
                        const freq = i * Math.ceil(animateWinding / meters)
                        const x = Math.max(
                            0,
                            300 * (freq / (windingFrequency + animateWinding)) -
                                3,
                        )

                        return (
                            <Fragment key={i}>
                                {x === 0 ? null : (
                                    <line
                                        x1={x}
                                        y1="74"
                                        x2={x}
                                        y2="76"
                                        stroke="#495778"
                                        strokeWidth={1}
                                    />
                                )}
                                <text
                                    x={x}
                                    y={90}
                                    fill="white"
                                    fontSize={8}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                >
                                    {windingFrequency + freq}
                                </text>
                            </Fragment>
                        )
                    })}
                <line
                    x1="0"
                    y1="75"
                    x2="305"
                    y2="75"
                    stroke="#495778"
                    strokeWidth={1}
                    markerEnd={`url(#${id}-arrow-head)`}
                />
                <line
                    x1="0"
                    y1="75.5"
                    x2="0"
                    y2="-5"
                    stroke="#495778"
                    strokeWidth={1}
                    markerEnd={`url(#${id}-arrow-head)`}
                />
                <g opacity={0.35}>
                    <use href={`#${id}-graph`} />
                </g>
                <g filter="blur(10px)" opacity={0.75}>
                    <use href={`#${id}-graph-clipped`} />
                </g>
                <g filter="blur(5px)">
                    <use href={`#${id}-graph-clipped`} />
                </g>
                <g>
                    <use href={`#${id}-graph-clipped`} />
                </g>
            </g>
        </svg>
    )
}
