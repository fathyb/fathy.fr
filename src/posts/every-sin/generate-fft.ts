export async function generateFFT(
    audioSampleUrl: string,
    { fps = 1, fftSize = 32 } = {},
) {
    const res = await fetch(audioSampleUrl)
    const buffer = await res.arrayBuffer()
    const ctx = new AudioContext()
    const audioBuffer = await ctx.decodeAudioData(buffer)
    const samples = Math.ceil(audioBuffer.duration * fps)
    const ratio = audioBuffer.duration / samples
    const binCount = fftSize / 2
    const fft = new Uint8Array(samples * binCount)

    for (let i = 0; i < samples; i++) {
        await analyze(
            audioBuffer,
            fft.subarray(i * binCount, i * binCount + binCount),
            { fftSize },
        )

        const ctx = new OfflineAudioContext({
            length: Math.ceil(20_000 / fps),
            sampleRate: 20_000,
            numberOfChannels: 1,
        })
        const source = ctx.createBufferSource()
        const analyser = ctx.createAnalyser()

        analyser.fftSize = fftSize
        analyser.smoothingTimeConstant = 0
        source.loop = true
        source.buffer = audioBuffer
        source.connect(analyser)
        source.start(0, i * ratio)

        await ctx.startRendering()

        analyser.getByteFrequencyData(
            fft.subarray(i * binCount, i * binCount + binCount),
        )

        source.stop()
        source.disconnect(analyser)
    }

    return { buffer: fft, samples, size: binCount }
}

async function analyze(
    input: AudioBuffer,
    output: Uint8Array,
    { sampleRate = 20_000, fftSize = 128 } = {},
) {
    const ctx = new OfflineAudioContext({
        length: sampleRate,
        sampleRate: sampleRate,
        numberOfChannels: 1,
    })
    const source = ctx.createBufferSource()
    const analyser = ctx.createAnalyser()

    analyser.fftSize = fftSize
    analyser.smoothingTimeConstant = 0
    source.loop = true
    source.buffer = input
    source.connect(analyser)
    //source.start(0, i * ratio)

    await ctx.startRendering()

    analyser.getByteFrequencyData(output)
}
