export function graphSvgPath(
    buffer: Uint8Array | Float64Array,
    { k = 1, bytes = buffer instanceof Uint8Array, width = 1, height = 1 } = {},
) {
    const size = buffer.length * 2
    const last = size - 4
    const curve = new Float64Array(size)
    const { length } = curve

    if (bytes) {
        const scale = 0xff / height / 0.8

        for (let i = 0; i < length; i += 2) {
            curve[i] = (i / (length - 1)) * width
            curve[i + 1] = (0xff - buffer[i / 2] + 25) / scale
        }
    } else {
        for (let i = 0; i < length; i += 2) {
            curve[i] = (i / (length - 1)) * width
            curve[i + 1] = ((-buffer[i / 2] * 0.975 + 1) / 2) * height
        }
    }

    const paths = [`M0,${curve[1].toFixed(2)}`]

    for (let i = 0; i < size - 2; i += 2) {
        const x0 = i ? curve[i - 2] : curve[0]
        const y0 = i ? curve[i - 1] : curve[1]

        const x1 = curve[i + 0]
        const y1 = curve[i + 1]

        const x2 = curve[i + 2]
        const y2 = curve[i + 3]

        const x3 = i !== last ? curve[i + 4] : x2
        const y3 = i !== last ? curve[i + 5] : y2

        const cp1x = x1 + ((x2 - x0) / 6) * k
        const cp1y = y1 + ((y2 - y0) / 6) * k

        const cp2x = x2 - ((x3 - x1) / 6) * k
        const cp2y = y2 - ((y3 - y1) / 6) * k

        paths.push(
            `C${cp1x.toFixed(2)},${cp1y.toFixed(2)},${cp2x.toFixed(
                2,
            )},${cp2y.toFixed(2)},${x2.toFixed(2)},${y2.toFixed(2)}`,
        )
    }

    return paths.join('')
}
