import { visit } from 'unist-util-visit'

const urlPattern = /^(https?:)?\//
const relativePathPattern = /\.\.?\//

export default () => (ast) => {
    const imports = []
    const imported = new Map()

    visit(ast, 'paragraph', (node, index, parent) => {
        const [svg] = node.children

        if (svg?.type !== 'image') {
            return
        }

        let { url } = svg

        if (urlPattern.test(url) || !/\.svg\?embed$/.test(url)) {
            return
        }

        if (!relativePathPattern.test(url)) {
            url = `./${url}`
        }

        let name = imported.get(url)

        if (!name) {
            name = `__${imported.size}_${url.replace(/\W/g, '_')}__`

            imports.push(makeImport(name, url))
            imported.set(url, name)
        }

        parent.children.splice(index, 1, {
            name,
            type: 'mdxJsxFlowElement',
            children: [],
        })
    })

    visit(ast, 'mdxJsxFlowElement', (node, index, parent) => {
        if (node.name !== 'img') {
            return
        }

        let src = node.attributes.find((a) => a.name === 'src')
        let url = src?.value

        if (!url || urlPattern.test(url)) {
            return
        }

        let name = imported.get(url)

        if (!name) {
            name = `__${imported.size}_${url.replace(/\W/g, '_')}__`

            imports.push(makeImport(name, url))
            imported.set(url, name)
        }

        if (!/\.svg\?embed$/.test(url)) {
            src.value = {
                type: 'mdxJsxAttributeValueExpression',
                value: name,
                data: {
                    estree: {
                        type: 'Program',
                        sourceType: 'module',
                        comments: [],
                        body: [
                            {
                                type: 'ExpressionStatement',
                                expression: { type: 'Identifier', name },
                            },
                        ],
                    },
                },
            }

            parent.children.splice(index, 1, {
                type: 'mdxJsxTextElement',
                name: 'img',
                children: [],
                attributes: node.attributes,
            })

            return
        }

        if (!relativePathPattern.test(url)) {
            url = `./${url}`
        }

        const align = node.attributes.find((a) => a.name === 'align')?.value

        parent.children.splice(index, 1, {
            name,
            attributes: align
                ? [
                      {
                          type: 'mdxJsxAttribute',
                          name: 'className',
                          value: `align-${align}`,
                      },
                  ]
                : [],
            type: 'mdxJsxFlowElement',
            children: [],
        })
    })

    ast.children.unshift(...imports)
}

function makeImport(name, url) {
    return {
        type: 'mdxjsEsm',
        value: '',
        data: {
            estree: {
                type: 'Program',
                sourceType: 'module',
                body: [
                    {
                        type: 'ImportDeclaration',
                        source: {
                            type: 'Literal',
                            value: url,
                        },
                        specifiers: [
                            {
                                type: 'ImportDefaultSpecifier',
                                local: { type: 'Identifier', name },
                            },
                        ],
                    },
                ],
            },
        },
    }
}
