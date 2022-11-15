import { Box } from '@mui/material'
import { useRef, useState } from 'react'

import { useInterval } from '../../hooks/use-interval'
import { ResponsiveText } from '../../components/responsive-text'
import { useVisibilityCheck } from '../../hooks/use-visibility-check'

const فاتْحي = [
    'فاتْحي',
    'ف اتْحي',
    'ف ا تْحي',
    'ف ا تْ حي',
    'ف ا تْ ح ي',
    'ف ا تْ حي',
    'ف ا تْحي',
    'ف اتْحي',
]
const y =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox')
        ? 'y' // Firefox doesn't render diacritics correctly
        : 'ȳ'
const fātḥȳ = [
    `fātḥȳ`,
    `f ātḥȳ`,
    `f ā tḥȳ`,
    `f ā t ḥȳ`,
    `f ā t ḥ ȳ`,
    `f ā t ḥȳ`,
    `f ā tḥȳ`,
    `f ātḥȳ`,
]

export function LigaturesAnimation() {
    const ref = useRef<HTMLElement>(null)
    const visible = useVisibilityCheck(ref)
    const [index, setIndex] = useState(0)

    useInterval(() => setIndex((x) => (x === فاتْحي.length - 1 ? 0 : x + 1)), {
        pause: !visible,
    })

    return (
        <Box
            ref={ref}
            className="align-right"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
        >
            {[fātḥȳ, فاتْحي].map((words, i) => (
                <ResponsiveText
                    key={i}
                    fill="white"
                    width={425}
                    height={150}
                    fontSize={90}
                    fontFamily={
                        i === 0 ? "'Plus Jakarta Sans'" : 'Janna LT Regular'
                    }
                >
                    {words[index].replace('ȳ', y)}
                </ResponsiveText>
            ))}
        </Box>
    )
}
