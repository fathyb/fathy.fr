import { Box, useTheme } from '@mui/material'

export interface Props {
    children: [JSX.Element, JSX.Element]
    align?: 'left' | 'right'
    textAlign?: 'left' | 'right'
}

export function ResponsiveSplitter({
    children,
    align = 'right',
    textAlign = 'left',
}: Props) {
    const [a, b] = children
    const theme = useTheme()

    return (
        <Box
            sx={{
                clear: align,
                display: 'block',

                [`@media (max-width: ${theme.spacing(125)})`]: {
                    display: 'flex',
                    flexDirection: 'column-reverse',
                },
            }}
        >
            <Box className={`align-${align}`}>{b}</Box>
            <Box textAlign={textAlign}>{a}</Box>
        </Box>
    )
}
