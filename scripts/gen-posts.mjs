#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import remarkMdx from 'remark-mdx'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

const mdx = unified().use(remarkParse).use(remarkMdx).use(remarkMath)
const rootDir = path.dirname(new URL(import.meta.url).pathname)
const postsDir = path.join(rootDir, '../src/posts')
const generatedDir = path.join(rootDir, '../src/generated')
const files = await fs.readdir(postsDir, { withFileTypes: true })
const posts = await Promise.all(
    files
        .filter((file) => file.isDirectory() && !file.name.startsWith('.'))
        .map(async ({ name: file }) =>
            Promise.all([
                fs
                    .readFile(path.join(postsDir, file, 'index.mdx'), 'utf-8')
                    .then(async (contents) => {
                        const tree = mdx.parse(contents)
                        const title = tree.children
                            .find((c) => c.type === 'heading' && c.depth === 1)
                            ?.children.map((node) => {
                                if (typeof node.value === 'string') {
                                    return node.value
                                } else {
                                    console.error('node:', node)

                                    throw new Error('Unsupported title node!')
                                }
                            })
                            .join('')
                            .trim()

                        if (!title) {
                            throw new Error(
                                `Could not find post title for ${file}`,
                            )
                        }

                        let preview = ''
                        let description = ''

                        for (let i = 0; i < tree.children.length; i++) {
                            const node = tree.children[i]

                            if (node.type === 'thematicBreak') {
                                break
                            }

                            preview += contents.slice(
                                node.position.start.offset,
                                tree.children[i + 1]
                                    ? tree.children[i + 1].position.start.offset
                                    : node.position.end.offset,
                            )
                        }

                        for (let i = 3; i < tree.children.length; i++) {
                            const node = tree.children[i]

                            if (
                                node.type === 'mdxjsEsm' ||
                                node.type === 'mdxJsxFlowElement'
                            ) {
                                continue
                            }

                            if (node.type === 'thematicBreak') {
                                break
                            }

                            description += contents.slice(
                                node.position.start.offset,
                                tree.children[i + 1]
                                    ? tree.children[i + 1].position.start.offset
                                    : node.position.end.offset,
                            )
                        }

                        await Promise.all([
                            fs.writeFile(
                                path.join(
                                    postsDir,
                                    file,
                                    'index.preview.gen.mdx',
                                ),
                                preview,
                            ),
                            fs.writeFile(
                                path.join(
                                    postsDir,
                                    file,
                                    'index.description.gen.mdx',
                                ),
                                description,
                            ),
                        ])

                        return { file, title }
                    }),
                fs
                    .stat(path.join(postsDir, file, 'index.tsx'), 'utf-8')
                    .then(() => true)
                    .catch((error) => {
                        if (error?.code === 'ENOENT') {
                            return false
                        } else {
                            throw error
                        }
                    })
                    .then((provider) =>
                        fs.writeFile(
                            path.join(generatedDir, `${file}.entry.tsx`),
                            `
                                import Post from ${JSON.stringify(
                                    `../posts/${file}${
                                        provider ? '' : '/index.mdx'
                                    }`,
                                )}
                                
                                export default Post
                            `,
                        ),
                    ),
            ]).then(([post]) => post),
        ),
)

const chunks = posts.map((post) => {
    const slug = post.file.replace(/\.mdx?$/, '')

    return `
        {
            path: ${JSON.stringify('/' + slug)},
            title: ${JSON.stringify(post.title)},
            post: lazy(() =>
                import(${JSON.stringify(`./${post.file}.entry`)})
            ),
            description: lazy(() =>
                import(${JSON.stringify(
                    path.join(
                        '../posts',
                        post.file,
                        'index.description.gen.mdx',
                    ),
                )})
            ),
            preview: require(${JSON.stringify(
                path.join('../posts', post.file, 'index.preview.gen.mdx'),
            )}).default,
        }
    `
})

await fs.mkdir(generatedDir, { recursive: true })
await fs.writeFile(
    path.join(generatedDir, 'posts.ts'),
    [
        `import { lazy } from 'react'`,
        'export const posts = [',
        chunks.join(',\n'),
        ']',
    ].join('\n'),
)
