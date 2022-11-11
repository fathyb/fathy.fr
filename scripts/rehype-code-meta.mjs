import { visit } from 'unist-util-visit'

export default () => (tree) =>
    visit(tree, 'element', (node, _index, parent) => {
        if (parent?.type === 'element' && parent.tagName === 'pre') {
            if (node.tagName === 'code' && node.data && node.data.meta) {
                parent.properties.meta = node.data.meta
            }
        }
    })
