import { useState } from 'react'
import { matchPath, useLocation } from 'react-router'
import { Box, Typography, useTheme } from '@mui/material'

import { posts } from '../generated/posts'
import { useTitle } from '../hooks/use-title'
import { ThemeProvider } from '../providers/theme-provider'
import { useGlobalTransition } from '../providers/router-provider'

import { Link } from './link'
import { Sidebar } from './sidebar'
import { MDXWrapper } from './mdx-wrapper'
import { Footer } from './footer'

export function App() {
    return (
        <ThemeProvider>
            <Route />
        </ThemeProvider>
    )
}

function Route() {
    const theme = useTheme()
    const { pathname } = useLocation()
    const [pending] = useGlobalTransition()
    const [pendingPost, setPendingPost] = useState('')
    const post = posts.find((p) => matchPath(p.path, pathname))

    useTitle(post ? `${post.title} - Fathy Boundjadj` : 'Fathy Boundjadj')

    if (post) {
        return (
            <MDXWrapper main>
                <post.post />
                <Footer githubEditPath={`src/posts/${post.path}/index.mdx`} />
            </MDXWrapper>
        )
    }

    if (!matchPath('/', pathname)) {
        return <h2>not found</h2>
    }

    return (
        <>
            <Box
                sx={{
                    position: 'relative',
                    padding: theme.spacing(2),
                    zIndex: 500,

                    [`@media (min-width: ${theme.spacing(125)})`]: {
                        padding: 0,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: theme.spacing(33),
                    },
                }}
            >
                <Sidebar />
            </Box>
            {posts.map((post) => (
                <Box key={post.path} position="relative" zIndex={100}>
                    <MDXWrapper
                        sx={{
                            overflow: 'hidden',
                            position: 'relative',
                            maxHeight: theme.spacing(60),
                            maskImage:
                                'linear-gradient(rgba(0, 0, 0, 1), rgba(0, 0, 0, 0) 90%)',
                        }}
                    >
                        <post.preview />
                    </MDXWrapper>

                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: theme.spacing(1),
                            right: 0,
                            left: 0,

                            textAlign: 'center',
                        }}
                    >
                        <Typography>
                            <Link
                                to={post.path}
                                onClick={() => {
                                    setPendingPost(post.path)
                                }}
                            >
                                {pending && pendingPost === post.path
                                    ? 'Loading..'
                                    : 'Read more..'}
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            ))}
        </>
    )
}
