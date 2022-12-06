import { useRef } from 'react'

import { usePromise } from '../../hooks/use-promise'
import { useVisibilityCheck } from '../../hooks/use-visibility-check'
import { useRequestAnimationFrame } from '../../hooks/use-raf'

import AudioSample from './good-times.mp3'
import { generateFFT } from './generate-fft'
import { graphSvgPath } from './graph-svg-path'

const duration = 5_000
const width = 500
const height = 350

export default function GoodTimes() {
    const svg = useRef<SVGSVGElement>(null)
    const path = useRef<SVGPathElement>(null)
    const visible = useVisibilityCheck(svg)
    const [paths, { error }] = usePromise(async () => {
        const { buffer, samples, size } = await generateFFT(AudioSample)
        const paths = Array<string>(samples)
        const output = Array<string>()

        for (let i = 0; i < samples; i++) {
            const index = i * size

            paths[i] = graphSvgPath(buffer.subarray(index, index + size), {
                width,
                height,
            })
        }

        return paths
    }, [AudioSample])

    if (error) {
        throw error
    }

    useRequestAnimationFrame((time) => {
        if (!visible || !paths || !path.current) {
            return
        }

        path.current.setAttribute(
            'd',
            paths[Math.floor(((time % duration) / duration) * paths.length)],
        )
    })

    return (
        <svg ref={svg} viewBox={`0 0 ${width} ${height}`}>
            <path ref={path} fill="none" stroke="red" strokeWidth={2} />
        </svg>
    )
}
