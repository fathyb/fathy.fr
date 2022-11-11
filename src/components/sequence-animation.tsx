import { makeStyles } from 'tss-react/mui'
import { Box, BoxProps } from '@mui/material'
import { useRef, useState } from 'react'

import { useInterval } from '../hooks/use-interval'
import { useVisibilityCheck } from '../hooks/use-visibility-check'

export interface SequenceAnimationOptions {
    pause?: boolean
    interval?: number
}

export function SequenceAnimation({
    pause,
    interval,
    children,
    ...props
}: BoxProps & SequenceAnimationOptions & { children: JSX.Element[] }) {
    const [child, ref] = useSequenceAnimation(children, { pause, interval })
    const { classes, cx } = useStyles()

    return (
        <Box {...props} ref={ref} className={cx(classes.root, props.className)}>
            <noscript>You need JavaScript to view this animation.</noscript>
            {child}
        </Box>
    )
}

export function useSequenceAnimation(
    children: JSX.Element[],
    { pause, interval }: SequenceAnimationOptions = {},
) {
    const ref = useRef<HTMLElement>(null)
    const visible = useVisibilityCheck(ref)
    const [index, setIndex] = useState(0)

    useInterval(() => setIndex((x) => (x + 1) % children.length), {
        interval,
        pause: pause || !visible,
    })

    return [children[index], ref, index] as const
}

const useStyles = makeStyles()((theme) => ({
    root: {
        position: 'relative',

        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignslides: 'center',

        '&>*': {
            width: '100%',
            height: 'auto',
        },
    },
    item: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'absolute',

        '&>*': {
            opacity: 0,
            pointerEvents: 'none',
        },
        '& svg': {
            transition: theme.transitions.create('opacity', { duration: 250 }),
        },
    },
    show: {
        '&>*': {
            opacity: 1,
        },
        '&>svg': {
            transition: 'none',
        },
    },
}))
