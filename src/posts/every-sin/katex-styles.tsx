import useStyles from 'isomorphic-style-loader/useStyles'

import Katex from 'katex/dist/katex.min.css'

export default function KatexStyles() {
    useStyles(Katex)
}
