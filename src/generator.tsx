import { join } from 'path'
import { Writable } from 'stream'
import { StaticRouter } from 'react-router-dom/server'
import { CacheProvider } from '@emotion/react'
import { readFile, writeFile } from 'fs/promises'
import { renderToPipeableStream, renderToString } from 'react-dom/server'
import createEmotionServer from '@emotion/server/create-instance'

import { App } from './components/app'
import { posts } from './generated/posts'
import { StyleProvider } from './providers/style-provider'
import { TitleProvider } from './providers/title-provider'
import { createStyleCache } from './providers/theme-provider'

main().catch((error) => {
    console.error(error)

    process.exit(1)
})

async function main() {
    const dest = join(__dirname, '../../web/prod')
    const index = await readFile(join(dest, 'index.html'), 'utf-8')

    await Promise.all(
        ['/', '404', ...posts.map((p) => p.path)].map(async (path) => {
            const { head, title, body } = await render(path)

            await writeFile(
                join(dest, `${path === '/' ? 'index' : path}.html`),
                index
                    .replace(
                        '<title>Fathy</title>',
                        renderToString(<title>{title}</title>),
                    )
                    .replace('</head>', `${head}</head>`)
                    .replace('<body>', `<body><div id="root">${body}</div>`),
            )
        }),
    )
}

async function render(path: string) {
    const chunks: Buffer[] = []
    const css: string[] = []
    const cssCache = createStyleCache()
    const cssServer = createEmotionServer(cssCache)
    const title = { value: 'Fathy' }

    await new Promise<void>((resolve, reject) => {
        renderToPipeableStream(
            <TitleProvider value={title}>
                <StaticRouter location={path}>
                    <StyleProvider exportCss={(style) => css.push(style)}>
                        <CacheProvider value={cssCache}>
                            <App />
                        </CacheProvider>
                    </StyleProvider>
                </StaticRouter>
            </TitleProvider>,
        ).pipe(
            new Writable({
                write(chunk, encoding, callback) {
                    chunks.push(Buffer.from(chunk, encoding))

                    callback(null)
                },
                destroy(error, callback) {
                    if (error) {
                        reject(error)
                    } else {
                        resolve()
                    }

                    callback(null)
                },
            }),
        )
    })

    const body = Buffer.concat(chunks).toString('utf-8')

    return {
        body,
        title: title.value,
        head: [
            `<style>`,
            ...css,
            '</style>',
            ...cssServer
                .extractCriticalToChunks(body)
                .styles.filter((style) => style.css.length)
                .map(
                    ({ key, ids, css }) =>
                        `<style data-emotion="${key} ${ids.join(' ')}">` +
                        css +
                        '</style>',
                ),
        ].join(''),
    }
}
