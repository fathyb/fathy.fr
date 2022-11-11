import Mail from '@mui/icons-material/Mail'
import GitHub from '@mui/icons-material/GitHub'
import LinkedIn from '@mui/icons-material/LinkedIn'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import { PropsWithChildren, useState } from 'react'
import { Avatar, Box, Typography, useTheme } from '@mui/material'

import Picture from '../generated/me.jpg'
import { Link } from './link'
import { useScrollListener } from '../hooks/use-scroll-listener'
import { StackOverflowIcon } from './icons/stackoverflow.icon'

export function Sidebar({ children }: PropsWithChildren<{}>) {
    const theme = useTheme()
    const [pageTop, setPageTop] = useState(true)

    useScrollListener(() => setPageTop(scrollY < 72))

    return (
        <>
            <Link to="/" sx={{ textDecoration: 'none' }}>
                <Box
                    my={2}
                    display="flex"
                    flexDirection="row"
                    justifyContent="stretch"
                    alignItems="center"
                    component="span"
                >
                    <Avatar src={Picture} alt="A photo of myself" />
                    <Box
                        ml={2}
                        component="span"
                        display="flex"
                        flexDirection="column"
                    >
                        <Typography component="span" variant="h4">
                            Fathy
                        </Typography>
                    </Box>
                </Box>
            </Link>
            <Box position="sticky" top={theme.spacing(2)}>
                <Box
                    my={2}
                    display="flex"
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                        '& a': {
                            color: theme.palette.text.secondary,
                            padding: `0 ${theme.spacing(2)}`,

                            '&:first-of-type': {
                                paddingLeft: 0,
                            },
                        },

                        [`@media (max-width: ${theme.spacing(125)})`]: {
                            justifyContent: 'flex-start',
                        },
                    }}
                >
                    <Link
                        onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}
                        aria-label="Back to top"
                        sx={{
                            opacity: pageTop ? 0 : 1,
                            transition: theme.transitions.create('opacity'),
                            pointerEvents: pageTop ? 'none' : 'auto',
                        }}
                    >
                        <ArrowUpward />
                    </Link>
                    <Link to="mailto:hey@fathy.fr" aria-label="Contact me">
                        <Mail />
                    </Link>
                    <Link
                        external
                        to="https://github.com/fathyb"
                        aria-label="My GitHub profile"
                    >
                        <GitHub />
                    </Link>
                    <Link
                        external
                        to="https://linkedin.com/in/fathyishere"
                        aria-label="My LinkedIn profile"
                    >
                        <LinkedIn />
                    </Link>
                    <Link
                        external
                        to="https://stackoverflow.com/users/4118124/fathy"
                        aria-label="My StackOverlow profile"
                    >
                        <StackOverflowIcon />
                    </Link>
                </Box>
                {children}
            </Box>
        </>
    )
}
