import { graphSvgPath } from './graph-svg-path'

export type Point = [x: number, y: number]

export interface WindingCenter {
    curve: string
    get(time: number): [x: number, y: number]
}

const width = 300
const height = 150
const piHalf = Math.PI / 2
const piDouble = Math.PI * 2
const timeSamples = 128
const timeSamplesBound = timeSamples - 1
const curveIndex = (1 / timeSamplesBound) * piDouble

export function findWindingCenter({
    function: g = Math.sin,
    samples = 512,
    inputFrequency = 10,
    animateWinding = 10,
    windingFrequency = 0,
}): WindingCenter {
    const bound = timeSamples - 1
    const curve = new Float64Array(timeSamples)
    const xBuffer = new Float64Array(timeSamples)
    const yBuffer = new Float64Array(timeSamples)

    for (let i = 0; i < timeSamples; i++) {
        curve[i] = g(i * curveIndex + piHalf)
    }

    for (let x = 0; x < timeSamples; x++) {
        const winding =
            windingFrequency + ((x + 1) / timeSamplesBound) * animateWinding
        const factor = inputFrequency / winding
        const angles = Math.min(1, winding)
        let centerX = 0
        let centerY = 0
        let divider = 0

        for (let i = 1; i <= samples; i++) {
            const angle = (i / samples) * angles
            const radians = angle * piDouble

            for (let t = angle; t <= winding; t += 1.0) {
                const value =
                    curve[
                        Math.ceil(
                            Math.abs((t * factor) % 1.0) * timeSamplesBound,
                        )
                    ]

                centerX += value * Math.cos(radians)
                centerY += value * Math.sin(radians)
                divider += 1
            }
        }

        divider = Math.max(1, divider)

        xBuffer[x] = centerX / divider
        yBuffer[x] = -centerY / divider
    }

    return {
        get,
        curve: graphSvgPath(xBuffer, { width, height }),
    }

    function get(time: number): Point {
        const p = Math.abs(time % 1) * bound
        const i = Math.ceil(p)

        if (i >= bound - 1) {
            return [xBuffer[i], yBuffer[i]]
        } else {
            const d = p % 1.0

            return [
                xBuffer[i] * (1 - d) + xBuffer[i + 1] * d,
                yBuffer[i] * (1 - d) + yBuffer[i + 1] * d,
            ]
        }
    }
}
