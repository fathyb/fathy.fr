const path = require('path')

module.exports = function (source) {
    return (
        source +
        `
import { Footer } from ${JSON.stringify(
            relative(this.resourcePath, '../src/components/footer.tsx'),
        )}

<div className='mdx-footer'>
  <Footer githubEditPath={${JSON.stringify(
      path.relative(path.resolve(__dirname, '..'), this.resourcePath),
  )}}/>
</div>
`
    )
}

function relative(resource, module) {
    const relative = path.relative(
        path.dirname(resource),
        require.resolve(module),
    )

    return relative[0] === '.' ? relative : relative ? '.' + relative : '.'
}
