import useStyles from 'isomorphic-style-loader/useStyles'
import StyleContext from 'isomorphic-style-loader/StyleContext'
import { PropsWithChildren } from 'react'

import jakarta400 from '@fontsource/plus-jakarta-sans/400.css'
import jakarta700 from '@fontsource/plus-jakarta-sans/700.css'

import main from '../main.css'

export interface Style {
    _getCss(): string
    _insertCss(): () => void
}

export interface Props {
    exportCss?(css: string): void
}

export function StyleProvider({
    exportCss,
    children,
}: PropsWithChildren<Props>) {
    return (
        <StyleContext.Provider
            value={{
                insertCss(...styles: Style[]) {
                    if (exportCss) {
                        styles.forEach((style) => exportCss(style._getCss()))
                    } else {
                        const removeCss = styles.map((s) => s._insertCss())

                        return () => removeCss.forEach((remove) => remove())
                    }
                },
            }}
        >
            <InternalStyleProvider>{children}</InternalStyleProvider>
        </StyleContext.Provider>
    )
}

function InternalStyleProvider({ children }: PropsWithChildren<{}>) {
    useStyles(main, jakarta400, jakarta700)

    return <>{children}</>
}
