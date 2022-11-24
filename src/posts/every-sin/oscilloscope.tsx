import { Box, Button, Slider } from '@mui/material'
import { useEffect, useRef } from 'react'

import { useRequestAnimationFrame } from '../../hooks/use-raf'

interface Context {
    type: OscillatorType
    model: 'toolbox' | 'compose'
    frequency: number
    harmonics: number
    gfx: {
        osc: null | CanvasRenderingContext2D
        fft: null | CanvasRenderingContext2D
    }
    audio: null | {
        ctx: OfflineAudioContext
        analyser: AnalyserNode
    }
}

const gradientImage = generateGradient()

export interface Props {
    type?: OscillatorType
    model?: 'toolbox' | 'compose'
}

export default function Oscilloscope({ type, model }: Props) {
    const ref = useRef<Context>({
        type: type ?? 'square',
        audio: null,
        model: model ?? 'toolbox',
        frequency: model === 'compose' ? 440 : 517,
        harmonics: 8,
        gfx: { osc: null, fft: null },
    })

    useEffect(() => {
        render(ref.current)
    }, [])

    return (
        <Box mt={2} mb={4} display="flex" flexDirection="row">
            {model === 'compose' ? (
                <Box>
                    <Slider
                        min={0}
                        max={64}
                        orientation="vertical"
                        defaultValue={ref.current.harmonics}
                        aria-label="Frequency"
                        valueLabelDisplay="auto"
                        onKeyDown={preventHorizontalKeyboardNavigation}
                        sx={{
                            mx: 2,

                            '& input[type="range"]': {
                                WebkitAppearance: 'slider-vertical',
                            },
                        }}
                        onChange={(_, value) => {
                            if (typeof value === 'number' && ref.current) {
                                ref.current.harmonics = Math.min(50, value)

                                render(ref.current)
                            }
                        }}
                    />
                </Box>
            ) : (
                <Box display="flex" flexDirection="row" mr={4}>
                    <Box display="flex" flexDirection="column" mr={2}>
                        <Button
                            onClick={() => {
                                if (ref.current.audio) {
                                    ref.current.type = 'square'

                                    render(ref.current)
                                }
                            }}
                        >
                            Square
                        </Button>
                        <Button
                            onClick={() => {
                                if (ref.current.audio) {
                                    ref.current.type = 'sine'

                                    render(ref.current)
                                }
                            }}
                        >
                            Sine
                        </Button>
                        <Button
                            onClick={() => {
                                if (ref.current.audio) {
                                    ref.current.type = 'sawtooth'

                                    render(ref.current)
                                }
                            }}
                        >
                            Sawtooth
                        </Button>
                    </Box>

                    <Slider
                        sx={{
                            ml: 2,
                            '& input[type="range"]': {
                                WebkitAppearance: 'slider-vertical',
                            },
                        }}
                        orientation="vertical"
                        min={364}
                        max={2500}
                        defaultValue={ref.current.frequency}
                        aria-label="Frequency"
                        valueLabelDisplay="auto"
                        onKeyDown={preventHorizontalKeyboardNavigation}
                        onChange={(e, value) => {
                            if (typeof value === 'number' && ref.current) {
                                ref.current.frequency = value

                                render(ref.current)
                            }
                        }}
                    />
                </Box>
            )}

            <Box>
                <canvas
                    width={512}
                    height={256}
                    ref={(canvas) => {
                        ref.current.gfx.osc = canvas?.getContext('2d') ?? null

                        draw(ref.current)
                    }}
                />
                <canvas
                    width={512}
                    height={300}
                    ref={(canvas) => {
                        ref.current.gfx.fft = canvas?.getContext('2d') ?? null

                        draw(ref.current)
                    }}
                />
            </Box>
        </Box>
    )
}

function preventHorizontalKeyboardNavigation(event: React.KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
    }
}

function render(ref: Context) {
    const ctx = new OfflineAudioContext({
        length: 2048,
        sampleRate: 44100,
        numberOfChannels: 1,
    })
    const gain = ctx.createGain()
    const analyser = ctx.createAnalyser()

    analyser.fftSize = 2048

    if (ref.model === 'toolbox') {
        const oscillator = ctx.createOscillator()

        gain.gain.value = 1
        oscillator.type = ref.type
        oscillator.frequency.setValueAtTime(ref.frequency, ctx.currentTime)
        oscillator.start()
        oscillator.connect(gain)
        gain.connect(analyser)
    } else {
        for (let i = 1; i <= ref.harmonics; i += 2) {
            const gain = ctx.createGain()
            const oscillator = ctx.createOscillator()

            gain.gain.value = 1 / i
            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(
                ref.frequency * i,
                ctx.currentTime,
            )

            oscillator.start()
            oscillator.connect(gain)
            gain.connect(analyser)
        }
    }

    ctx.startRendering().then(() => draw(ref))

    ref.audio = { ctx, analyser }
}

function draw(ctx: Context) {
    drawSpectrum(ctx)
    drawOscilloscope(ctx)
}

function drawOscilloscope(ref: Context) {
    const { audio, gfx } = ref

    if (!audio || !gfx.osc || !gradientImage) {
        return
    }

    const { analyser } = audio
    const { osc: ctx } = gfx
    const { width, height } = ctx.canvas
    const horizontalScale = 1
    const timeData = new Uint8Array(analyser.frequencyBinCount)
    const scaling = height / 256
    const edgeThreshold = 5
    let risingEdge = 0

    const gradient = ctx.createPattern(gradientImage, 'repeat')

    if (!gradient) {
        return
    }

    analyser.getByteTimeDomainData(timeData)

    ctx.fillStyle = 'rgba(2, 3, 7, 1)'
    ctx.fillRect(0, 0, width, height)

    ctx.lineWidth = 2

    ctx.strokeStyle = gradient
    ctx.beginPath()

    const scaleWidth = width

    while (timeData[risingEdge++] - 128 > 0 && risingEdge <= scaleWidth);

    if (risingEdge >= scaleWidth) {
        risingEdge = 0
    }

    while (
        timeData[risingEdge++] - 128 < edgeThreshold &&
        risingEdge <= scaleWidth
    );

    if (risingEdge >= scaleWidth) {
        risingEdge = 0
    }

    for (
        let x = risingEdge;
        x < timeData.length && x - risingEdge < scaleWidth;
        x++
    ) {
        ctx.lineTo(
            (x - risingEdge) * horizontalScale,
            height - timeData[x] * scaling,
        )
    }

    ctx.stroke()
}

function generateGradient() {
    if (typeof document === 'undefined') {
        return null
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    const width = 512
    const height = 512

    canvas.width = width
    canvas.height = height

    {
        const gradient = ctx.createLinearGradient(0, 0, width, height)

        gradient.addColorStop(0, 'rgba(249, 0, 255, 0)')
        gradient.addColorStop(1, 'rgba(249, 0, 255, 1)')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
    }
    {
        const gradient = ctx.createLinearGradient(0, 0, width, height)

        gradient.addColorStop(0, 'rgba(150, 150, 255, 1)')
        gradient.addColorStop(1, 'rgba(5, 200, 255, 0)')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
    }
    {
        const gradient = ctx.createLinearGradient(0, 0, width, height)

        gradient.addColorStop(0, 'rgba(21, 56, 246, 0)')
        gradient.addColorStop(1, 'rgba(80, 196, 150, 1)')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
    }

    return canvas
}

function drawSpectrum(ref: Context) {
    const { audio, gfx } = ref

    if (!audio || !gfx.fft || !gradientImage) {
        return
    }

    const { analyser } = audio
    const { fft: ctx } = gfx
    const { width, height } = ctx.canvas
    const freqData = new Uint8Array(analyser.frequencyBinCount)
    const topPanelHeight = height * 0.165
    const scale = {
        x: (width / freqData.length) * 2.1,
        y: (height - topPanelHeight) / 256,
    }
    const gradient = ctx.createPattern(gradientImage, 'repeat')

    if (!gradient) {
        return
    }

    analyser.getByteFrequencyData(freqData)

    ctx.fillStyle = 'rgba(2, 3, 7, 1)'
    ctx.fillRect(0, 0, width, height)

    const maxFreq = analyser.context.sampleRate / 2
    const textSize = height * 0.075
    const fundamental = Math.round((ref.frequency / maxFreq) * freqData.length)
    const harmonics: {
        index: number
        harmonic: number
    }[] = []

    ctx.fillStyle = gradient
    ctx.font = `${textSize + 3}px Helvetica Neue`
    ctx.textBaseline = 'top'
    ctx.lineWidth = 2
    ctx.strokeStyle = gradient

    for (let i = fundamental; i < freqData.length; i += fundamental) {
        const harmonic = i / fundamental

        if (
            ref.type === 'sawtooth' ||
            (ref.type === 'sine' && harmonic === 1) ||
            (ref.type === 'square' && harmonic % 2 === 1)
        ) {
            harmonics.push({
                index: i,
                harmonic: i / fundamental,
            })
        }
    }

    for (const { harmonic, index } of harmonics) {
        const text = harmonic.toString()
        const size = ctx.measureText(text)
        const x = index * scale.x
        const position = x - size.width / 2
        const rightEdge = position + size.width

        if (rightEdge >= width) {
            break
        }

        const measure = fillText(ctx, text, x, 25, size)

        ctx.beginPath()
        ctx.moveTo(x, topPanelHeight)
        ctx.lineTo(x, topPanelHeight - measure.height / 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, measure.height / 2)
        ctx.lineTo(x, 2)
        ctx.stroke()
    }

    ctx.beginPath()
    ctx.moveTo(0, 1)
    ctx.lineTo(width, 1)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, topPanelHeight)
    ctx.lineTo(width, topPanelHeight)
    ctx.stroke()

    ctx.beginPath()

    for (let x = 0; x < freqData.length; x++)
        ctx.lineTo(x * scale.x, height - freqData[x] * scale.y)

    ctx.stroke()
}

function fillText(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    centerY: number,
    metrics?: TextMetrics,
) {
    const measure = measureText(ctx, text, metrics)

    ctx.fillText(
        text,
        centerX - measure.width / 2,
        centerY - measure.height / 2,
    )

    return measure
}

function measureText(
    ctx: CanvasRenderingContext2D,
    text: string,
    metrics = ctx.measureText(text),
) {
    return {
        width: metrics.width,
        height:
            metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent,
    }
}
