import { ThreeFrameProvider } from '../../hooks/use-three-frame'

import Content from './index.mdx'

export default function Post() {
    return (
        <ThreeFrameProvider>
            <Content />
        </ThreeFrameProvider>
    )
}
