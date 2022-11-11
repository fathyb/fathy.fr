#!/usr/bin/env node

import path from 'path'
import fetch from 'cross-fetch'
import { mkdir, writeFile } from 'fs/promises'

const rootDir = path.dirname(new URL(import.meta.url).pathname)
const dest = path.join(rootDir, '../src/generated')

await mkdir(dest, { recursive: true })
await Promise.all([
    fetch('https://avatars.githubusercontent.com/u/5746414?s=128').then(
        async (res) =>
            await writeFile(
                path.join(dest, 'me.jpg'),
                Buffer.from(await res.arrayBuffer()),
            ),
    ),
    fetch('https://excalidraw.com/Virgil.woff2').then(
        async (res) =>
            await writeFile(
                path.join(dest, 'Virgil.woff2'),
                Buffer.from(await res.arrayBuffer()),
            ),
    ),
])
