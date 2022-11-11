#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

const mdx = unified().use(remarkParse).use(remarkMdx)
const rootDir = path.dirname(new URL(import.meta.url).pathname)
const postsDir = path.join(rootDir, '../src/posts')
const files = await fs.readdir(postsDir, { withFileTypes: true })
const posts = await Promise.all(
    files
        .filter((file) => file.isDirectory() && !file.name.startsWith('.'))
        .map(async ({ name: file }) => {
            const contents = await fs.readFile(
                path.join(postsDir, file, 'index.mdx'),
                'utf-8',
            )
            const tree = mdx.parse(contents)
            const title = tree.children.find(
                (c) => c.type === 'heading' && c.depth === 1,
            )?.children[0]?.value

            if (!title || typeof title !== 'string') {
                throw new Error(`Could not find post title for ${file}`)
            }

            const secondHeading = tree.children.filter(
                (c) => c.type === 'heading' && c.depth === 2,
            )[1]

            await fs.writeFile(
                path.join(postsDir, file, 'preview.mdx'),
                secondHeading
                    ? contents.slice(0, secondHeading.position.start.offset)
                    : contents,
            )

            return { file, title }
        }),
)

const chunks = posts.map(
    (post) => `
        {
            path: ${JSON.stringify('/' + post.file.replace(/\.mdx?$/, ''))},
            title: ${JSON.stringify(post.title)},
            post: lazy(() =>
                import(${JSON.stringify(
                    path.join('../posts', post.file, 'index.mdx'),
                )})
            ),
            preview: lazy(() =>
                import(${JSON.stringify(
                    path.join('../posts', post.file, 'preview.mdx'),
                )})
            )
        }
    `,
)
const generatedDir = path.join(rootDir, '../src/generated')

await fs.mkdir(generatedDir, { recursive: true })
await fs.writeFile(
    path.join(generatedDir, 'posts.ts'),
    [
        `import { lazy } from 'react'`,
        'export const posts = [',
        ...chunks,
        ']',
    ].join('\n'),
)
