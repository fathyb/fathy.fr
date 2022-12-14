import LinkIcon from '@mui/icons-material/Link'
import useStyles from 'isomorphic-style-loader/useStyles'
import atomDarkTheme from 'prism-themes/themes/prism-atom-dark.css'
import { makeStyles } from 'tss-react/mui'
import { useLocation } from 'react-router'
import { MDXProvider } from '@mdx-js/react'
import { MDXComponents } from 'mdx/types'
import { Box, BoxProps, lighten, useTheme } from '@mui/material'
import { useEffect, useRef, PropsWithChildren, Fragment } from 'react'

import { Link } from './link'
import { Sidebar } from './sidebar'
import { useScrollListener } from '../hooks/use-scroll-listener'

export function MDXWrapper({
    children,
    main = false,
    ...props
}: PropsWithChildren<{ main?: boolean } & BoxProps>) {
    const ref = useTOCScrollListener()
    const { classes, cx } = useClasses()

    useStyles(atomDarkTheme)

    return (
        <Box
            ref={ref}
            className={cx(
                classes.wrapper,
                { 'hide-footer': !main, 'show-footer': main },
                props.className,
            )}
            {...props}
        >
            <Box className={classes.content} component="main">
                <MDXProvider components={components}>{children}</MDXProvider>
            </Box>
        </Box>
    )
}

const components: MDXComponents = {
    h1: ({ id, children }) => (
        <MDXHeader type="h1" id={id}>
            {children}
        </MDXHeader>
    ),
    h2: ({ id, children }) => (
        <MDXHeader type="h2" id={id}>
            {children}
        </MDXHeader>
    ),
    h3: ({ id, children }) => (
        <MDXHeader type="h3" id={id}>
            {children}
        </MDXHeader>
    ),
    h4: ({ id, children }) => (
        <MDXHeader type="h4" id={id}>
            {children}
        </MDXHeader>
    ),
    h5: ({ id, children }) => (
        <MDXHeader type="h5" id={id}>
            {children}
        </MDXHeader>
    ),
    h6: ({ id, children }) => (
        <MDXHeader type="h6" id={id}>
            {children}
        </MDXHeader>
    ),
    a: ({ href = '/', children }) => (
        <Link to={href.startsWith('.') ? href.replace(/.mdx$/, '') : href}>
            {children}
        </Link>
    ),
    nav: ({ children }) => (
        <div className="toc-wrapper">
            <Sidebar>
                <nav>{children}</nav>
            </Sidebar>
        </div>
    ),
    img: ({
        src,
        alt,
        align,
        className,
    }: JSX.IntrinsicElements['img'] & { align?: string }) => (
        <a
            href={src}
            target="_blank"
            className={[
                'img-link',
                className,
                align ? ` align-${align}` : '',
            ].join(' ')}
        >
            <img src={src} alt={alt} loading="lazy" />
        </a>
    ),
    pre: ({
        meta,
        children,
        ...props
    }: JSX.IntrinsicElements['pre'] & { meta?: string }) => {
        const theme = useTheme()
        const chrome = meta?.match(/^chromium\/(.*)#(.*)@(.*)$/)

        if (chrome) {
            const [, name, line, rev] = chrome
            const [lineStart] = line.split('-')

            return (
                <>
                    <Box
                        mx={1}
                        sx={{
                            code: {
                                fontSize: theme.typography.body2.fontSize,
                            },
                        }}
                    >
                        {`chromium/${name}`
                            .split('/')
                            .map((chunk, index, array) => {
                                const path = array.slice(1, index + 1).join('/')
                                const last = index === array.length - 1
                                const slash = last ? null : (
                                    <Box
                                        mx={1}
                                        component="code"
                                        sx={{
                                            color: `${theme.palette.text.secondary} !important`,
                                        }}
                                    >
                                        /
                                    </Box>
                                )
                                const url = last
                                    ? `${path};l=${line}`
                                    : path
                                    ? `${path}/`
                                    : ''

                                return (
                                    <Fragment key={index}>
                                        <Link
                                            to={`https://source.chromium.org/chromium/chromium/src/+/main:${url};drc=${rev}`}
                                        >
                                            <code>{chunk}</code>
                                        </Link>
                                        {slash}
                                    </Fragment>
                                )
                            })}

                        <Box ml={1} component="code">
                            line {lineStart}
                        </Box>
                    </Box>
                    <Box
                        component="pre"
                        className={props.className}
                        sx={{ paddingTop: '0 !important' }}
                    >
                        {children}
                    </Box>
                </>
            )
        } else {
            return <pre {...props}>{children}</pre>
        }
    },
}

function MDXHeader({
    id,
    type,
    children,
}: PropsWithChildren<{
    id?: string
    type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}>) {
    const theme = useTheme()

    return (
        <Box id={id} component={type}>
            {children}

            <Link
                to={'#' + id}
                aria-label="Link to this title"
                sx={{
                    ml: 2,
                    color: 'text.secondary',
                    verticalAlign: 'middle',
                    transition: theme.transitions.create('opacity'),

                    opacity: 0,
                    '*:hover>&': {
                        opacity: 0.9,
                    },
                    ':hover': {
                        opacity: 1,
                    },

                    svg: {
                        mt:
                            type === 'h2'
                                ? '4px'
                                : type === 'h3'
                                ? '6px'
                                : type === 'h4'
                                ? '7px'
                                : 0,
                        mb: type === 'h1' ? '4px' : 0,
                    },
                }}
            >
                <LinkIcon fontSize="small" />
            </Link>
        </Box>
    )
}

const useClasses = makeStyles()((theme) => ({
    wrapper: {
        position: 'relative',

        [`@media (min-width: ${theme.spacing(125)})`]: {
            width: `calc(100% - ${theme.spacing(35)})`,
        },
    },
    content: {
        color: theme.palette.text.primary,
        margin: 'auto',
        padding: theme.spacing(2),
        fontSize: 20,
        fontFamily: theme.typography.body1.fontFamily,
        overflowWrap: 'break-word',
        paddingBottom: theme.spacing(4),

        [`@media (min-width: ${theme.spacing(125)})`]: {
            maxWidth: theme.spacing(150),
        },

        '& h1:nth-of-type(1), & h1:nth-of-type(2)': {
            marginTop: 0,
        },

        '.img-link': {
            margin: `${theme.spacing(2)} auto`,
            display: 'block',
            textAlign: 'center',

            img: {
                maxWidth: `min(100%, ${theme.spacing(50)})`,
            },
        },

        'p, ul, ol': {
            '& code': {
                fontSize: 16,
            },
        },

        table: {
            margin: 'auto',
            display: 'block',
            maxWidth: '100%',
        },

        'tbody, thead': {
            display: 'flex',
            width: '100%',
            maxWidth: '100%',
            flexDirection: 'column',
        },

        tr: {
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
        },

        'td, th': {
            flex: 1,
            textAlign: 'center',

            img: {
                width: '100%',
            },
        },

        blockquote: {
            margin: 0,
            paddingLeft: theme.spacing(2),
            borderLeft: `2px solid rgba(255, 255, 255, 0.25)`,
            transition: theme.transitions.create('border-left'),

            ':hover': {
                borderLeft: `2px solid rgba(255, 255, 255, 0.5)`,
            },
        },

        '& .toc-wrapper': {
            '.hide-footer &': {
                display: 'none',
            },

            [`@media (min-width: ${theme.spacing(125)})`]: {
                top: 0,
                bottom: 0,
                width: theme.spacing(33),
                right: theme.spacing(-35),
                position: 'absolute',
            },
        },
        '& nav': {
            '&.toc-hidden': {
                display: 'none',
            },

            '.toc-header': {
                color: theme.palette.text.secondary,
                fontFamily: theme.typography.body1.fontFamily,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 700,
            },

            '.toc-item-h2 a': {
                paddingLeft: theme.spacing(2),
            },
            '.toc-item-h3 a': {
                paddingLeft: theme.spacing(4),
            },
            '.toc-item-h4 a': {
                paddingLeft: theme.spacing(6),
            },
            '.toc-item-h5 a': {
                paddingLeft: theme.spacing(8),
            },

            ol: {
                padding: 0,
            },

            li: {
                listStyleType: 'none',
                opacity: 0.75,

                a: {
                    display: 'block',
                    textDecoration: 'none',
                    fontSize: theme.typography.subtitle2.fontSize,
                    paddingLeft: theme.spacing(1),
                    paddingRight: theme.spacing(2),
                    color: theme.typography.h1.color,
                    borderLeft: `2px solid transparent`,
                    displat: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignContent: 'center',
                    marginBottom: theme.spacing(1),

                    '&.active, &:hover': {
                        borderLeftColor: theme.palette.primary.dark,
                    },
                    '&:hover': {
                        color: theme.palette.common.white,
                    },
                },
            },
        },

        '& h1, & h2, & h3, & h4, & h5, & h6': {
            clear: 'both',
            color: theme.palette.grey[200],
            fontFamily: theme.typography.h1.fontFamily,
        },
        '& h1, & h2, & h3, & h4, & h5, & h6, & p, & ol, & ul, & blockquote': {
            marginLeft: 'auto !important',
            marginRight: 'auto !important',

            [`@media (min-width: ${theme.spacing(125)})`]: {
                maxWidth: theme.spacing(125),
            },
        },
        '& code, & ol, & ul, & strong, & span.math': {
            color: lighten(theme.palette.text.primary, 0.35),
        },
        '&>:not(.toc-wrapper, .mdx-footer) a, &>a, &>:not(.toc-wrapper, .mdx-footer) a *, &>a *':
            {
                color: `${theme.palette.primary.main} !important`,
            },
        '&>:not(.toc-wrapper, .mdx-footer) p, &>p': {
            marginTop: `${theme.spacing(3)} !important`,
            marginBottom: `${theme.spacing(3)} !important`,
        },
        '&>:not(.toc-wrapper, .mdx-footer, h1, h2, h3, h4, h5, h6) svg, &>svg':
            {
                height: 'auto',
                margin: 'auto',
                display: 'block',
                maxWidth: '100%',
                marginBottom: theme.spacing(4),
            },
        '& .align-left, & .align-right': {
            [`@media (min-width: ${theme.spacing(125)})`]: {
                width: '45%',
                maxWidth: '45%',
                marginLeft: theme.spacing(2),

                '&.align-left': {
                    float: 'left',
                },
                '&.align-right': {
                    float: 'right',
                },
            },
        },
        '&>:not(.toc-wrapper, .mdx-footer) pre, &>pre': {
            padding: `${theme.spacing(1)} !important`,
            fontSize: '0.85rem',
            background: 'transparent !important',
            borderRadius: `${theme.shape.borderRadius}px !important`,

            ':not(.align-right, .align-left) &': {
                marginTop: `${theme.spacing(2)} !important`,
                marginBottom: `${theme.spacing(2)} !important`,
                marginLeft: 'auto !important',
                marginRight: 'auto !important',
            },

            [`@media (max-width: ${theme.spacing(125)})`]: {
                padding: '0 !important',
            },
        },
        '.mdx-footer': {
            display: 'none',
        },
        '&>.mdx-footer': {
            '.show-footer &': {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: theme.spacing(2),
                padding: `0 ${theme.spacing(0)}`,
            },

            [`@media (min-width: ${theme.spacing(125)})`]: {
                position: 'fixed',
                width: theme.spacing(33),
                right: theme.spacing(2),
                bottom: theme.spacing(2),
            },
        },

        '& .token': {
            textDecoration: 'none !important',
        },
    },
}))

function useTOCScrollListener() {
    const { pathname } = useLocation()
    const ref = useRef<null | HTMLElement>(null)
    const elements = useRef<null | {
        links: HTMLAnchorElement[]
        headings: HTMLElement[]
    }>(null)

    useEffect(() => {
        elements.current = {
            links: Array.from(
                ref.current?.querySelectorAll('nav a' as 'a') ?? [],
            ),
            headings: Array.from(
                ref.current?.querySelectorAll(
                    'h2, h3, h4, h5, h6' as 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
                ) ?? [],
            ).reverse(),
        }
    }, [pathname])

    useScrollListener(() => {
        if (!elements.current) {
            return
        }

        const { links, headings } = elements.current
        const y = window.scrollY + 8
        const heading =
            headings.find((h) => h.offsetTop < y) ??
            (headings.length ? headings[headings.length - 1] : null)

        if (heading) {
            const link = links.find((link) =>
                link.href.endsWith('#' + heading.id),
            )

            if (link) {
                const active = ref.current?.querySelector('nav a.active')

                if (active !== link) {
                    active?.classList.remove('active')
                    link.classList.add('active')
                }
            }
        }
    })

    return ref
}
