export async function generateFFT({
    type,
    frequency,
}: {
    type: OscillatorType
    frequency: number
}) {
    const fftSize = 256
    const ctx = new OfflineAudioContext({
        length: fftSize,
        sampleRate: 44100,
        numberOfChannels: 1,
    })
    const analyser = ctx.createAnalyser()
    const oscillator = ctx.createOscillator()

    analyser.fftSize = fftSize
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    oscillator.connect(analyser)
    oscillator.start()

    await ctx.startRendering()

    const fft = new Uint8Array(analyser.frequencyBinCount)
    const wave = new Float32Array(fftSize)

    analyser.getByteFrequencyData(fft)
    analyser.getFloatTimeDomainData(wave)

    return { fft, wave }
}
