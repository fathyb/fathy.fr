import Mail from '@mui/icons-material/Mail'
import GitHub from '@mui/icons-material/GitHub'
import RssFeed from '@mui/icons-material/RssFeed'
import LinkedIn from '@mui/icons-material/LinkedIn'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import { PropsWithChildren, useState } from 'react'
import { Avatar, Box, Typography, useTheme } from '@mui/material'

import Picture from '../generated/me.jpg'
import { useScrollListener } from '../hooks/use-scroll-listener'

import { Link } from './link'

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
                        <Typography component="span" variant="h5">
                            Fathy
                        </Typography>
                        <Typography component="span" variant="caption">
                            [ available for hire ]
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
                        title="Back to top"
                        sx={{
                            opacity: pageTop ? 0 : 1,
                            transition: theme.transitions.create('opacity'),
                            pointerEvents: pageTop ? 'none' : 'auto',
                        }}
                    >
                        <ArrowUpward />
                    </Link>
                    <Link to="mailto:hey@fathy.fr" title="Contact me">
                        <Mail />
                    </Link>
                    <Link
                        external
                        to="https://github.com/fathyb"
                        title="My GitHub profile"
                    >
                        <GitHub />
                    </Link>
                    <Link
                        external
                        to="https://linkedin.com/in/fathyishere"
                        title="My LinkedIn profile"
                    >
                        <LinkedIn />
                    </Link>
                    <Link external to="/rss.xml" title="RSS feed">
                        <RssFeed />
                    </Link>
                </Box>
                {children}
            </Box>
        </>
    )
}
