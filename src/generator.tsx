import { join } from 'path'
import { Feed } from 'feed'
import { Writable } from 'stream'
import { MDXProvider } from '@mdx-js/react'
import { StaticRouter } from 'react-router-dom/server'
import { CacheProvider } from '@emotion/react'
import { readFile, writeFile } from 'fs/promises'
import { PropsWithChildren, ReactNode } from 'react'
import { renderToPipeableStream, renderToString } from 'react-dom/server'
import createEmotionServer from '@emotion/server/create-instance'

import { App } from './components/app'
import { posts } from './generated/posts'
import { StyleProvider } from './providers/style-provider'
import { TitleProvider } from './providers/title-provider'
import { RouterProvider } from './providers/router-provider'
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
                        '<title>Fathy Boundjadj</title>',
                        renderToString(<title>{title}</title>),
                    )
                    .replace('</head>', `${head}</head>`)
                    .replace('<body>', `<body><div id="root">${body}</div>`),
            )
        }),
    )

    await generateFeed(dest)
}

async function render(path: string) {
    const css: string[] = []
    const cssCache = createStyleCache()
    const cssServer = createEmotionServer(cssCache)
    const title = { value: 'Fathy Boundjadj' }
    const body = await renderDOM(
        <TitleProvider value={title}>
            <RouterProvider.Transition>
                <StaticRouter location={path}>
                    <StyleProvider exportCss={(style) => css.push(style)}>
                        <CacheProvider value={cssCache}>
                            <App />
                        </CacheProvider>
                    </StyleProvider>
                </StaticRouter>
            </RouterProvider.Transition>
        </TitleProvider>,
    )

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

async function generateFeed(dest: string) {
    const feed = new Feed({
        id: 'https://fathy.fr',
        link: 'https://fathy.fr',
        title: 'Fathy Boundjadj',
        generator:
            'https://github.com/fathyb/fathy.fr/blob/main/src/generator.tsx',
        copyright: 'All rights reserved 2022, Fathy Boundjadj',
        description: "Fathy Boundjadj's personnal blog",
        feedLinks: {
            atom: 'https://fathy.fr/atom.xml',
            json: 'https://fathy.fr/feed.json',
        },
        author: {
            name: 'Fathy Boundjadj',
            link: 'https://fathy.fr',
            email: 'hey@fathy.fr',
        },
    })

    for (const post of posts) {
        const postDate = await readFile(
            join(__dirname, '../../../../src/posts', `${post.path}/index.mdx`),
            'utf-8',
        ).then((h) =>
            h
                .split('\n')
                .find((p) => p.startsWith('> '))
                ?.split(' ')
                .slice(1, 4)
                .join(' '),
        )
        const description = await renderDOM(
            <PreviewProvider>
                <post.description />
            </PreviewProvider>,
        ).then(
            (h) =>
                h
                    .replace(/<footer>.*/, '')
                    .replace(/<!-- -->/g, '')
                    .trim() +
                `<hr/><p><a href="https://fathy.fr${post.path}">Read more..</a></p>`,
        )

        const date = postDate ? new Date(`${postDate} 16:00 GMT+1`) : null

        if (!date) {
            throw new Error('Failed to infer post date')
        }

        if (date.getTime() < Date.now()) {
            feed.addItem({
                date,
                description,

                link: 'https://fathy.fr' + post.path,
                title: post.title,
            })
        }
    }

    await Promise.all([
        writeFile(join(dest, 'rss.xml'), feed.rss2()),
        writeFile(join(dest, 'atom.xml'), feed.atom1()),
        writeFile(join(dest, 'feed.json'), feed.json1()),
    ])
}

function PreviewProvider({ children }: PropsWithChildren<{}>) {
    return (
        <RouterProvider.Transition>
            <StaticRouter location="/">
                <MDXProvider
                    components={{
                        h1: () => null,
                        h2: ({ children }) => <h2>{children}</h2>,
                        div: () => null,
                        nav: () => null,
                        svg: () => null,
                        style: () => null,
                    }}
                >
                    {children}
                </MDXProvider>
            </StaticRouter>
        </RouterProvider.Transition>
    )
}

async function streamReader(pipe: (stream: Writable) => void) {
    const chunks: Buffer[] = []

    await new Promise<void>((resolve, reject) => {
        pipe(
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

    return Buffer.concat(chunks)
}

async function renderDOM(dom: ReactNode) {
    const buffer = await streamReader((dest) =>
        renderToPipeableStream(dom).pipe(dest),
    )

    return buffer.toString('utf-8')
}
