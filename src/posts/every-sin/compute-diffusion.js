const { resolve } = require('path')
const { writeFileSync, mkdirSync } = require('fs')

const width = 256
const height = 256

mkdirSync(resolve(__dirname, '../../generated'), { recursive: true })
writeFileSync(
    resolve(__dirname, '../../generated/middle.heat-diffusion.dat'),
    computeDiffusion(middleHeat, 1536),
)
writeFileSync(
    resolve(__dirname, '../../generated/simple.heat-diffusion.dat'),
    simpleDiffusion(),
)
writeFileSync(
    resolve(__dirname, '../../generated/contact.heat-diffusion.dat'),
    computeDiffusion(contactHeat, 4096 * 2 + 1024),
)

function middleHeat(buffer) {
    for (let x = 0; x < width; x++) {
        buffer[x] = Math.sin(Math.PI * (x / width))
    }
}
function contactHeat(buffer) {
    buffer.fill(1, 0, width / 2)
    buffer.fill(0, width / 2, width)
}

function simpleDiffusion() {
    const buffer = Buffer.alloc(width * height)
    const ω = 2 // wave angle
    const k = 1 // conductivity

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            buffer[y * width + x] =
                Math.cos((x / width) * ω) *
                Math.E ** (-k * ω ** 2 * (y / height)) *
                0xff
        }
    }

    return buffer
}

function computeDiffusion(gen, speed) {
    const size = width * height
    const buffer = Buffer.alloc(size)
    let current = new Float64Array(width)
    let next = new Float64Array(width)

    gen(current)

    for (let x = 0; x < width; x++) {
        buffer[x] = current[x] * 0xff
    }

    const dx = 1
    const dt = 0.01
    const alpha = 1
    const end = width - 1
    const beforeEnd = end - 1
    const dtAlpha = dt * alpha

    for (let y = 1; y < height; y++) {
        for (let s = 0; s < speed; s++) {
            next[0] = current[0] + (dtAlpha * (current[1] - current[0])) / dx
            next[end] =
                current[end] +
                (dtAlpha * (current[beforeEnd] - current[end])) / dx

            for (let x = 1; x < end; x++) {
                const z = current[x]

                next[x] =
                    z + dtAlpha * (current[x + 1] + current[x - 1] - 2 * z)
            }

            const line = next

            next = current
            current = line
        }

        for (let x = 0; x < width; x++) {
            buffer[y * width + x] = current[x] * 0xff
        }
    }

    return buffer
}
