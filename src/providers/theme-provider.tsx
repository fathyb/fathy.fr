import createEmotionCache from '@emotion/cache'
import { grey } from '@mui/material/colors'
import { PropsWithChildren } from 'react'
import {
    alpha,
    createTheme,
    ThemeProvider as MuiThemeProvider,
} from '@mui/material'

export function ThemeProvider({ children }: PropsWithChildren<{}>) {
    return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}

export function createStyleCache(nonce?: string) {
    return createEmotionCache({
        key: 'm',
        nonce,
        insertionPoint:
            typeof document !== 'undefined'
                ? document.querySelector('title') ?? undefined
                : undefined,
    })
}

const defaultFont = [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
]
    .map((s) => JSON.stringify(s))
    .join(',')

const headingFont = `'Plus Jakarta Sans', ${defaultFont}`
const supportsBackdropFilter =
    typeof document !== 'undefined' && document.body
        ? 'backdropFilter' in document.body.style
        : true

const divider = '#181d2c'
const currentPalette = 'dark' as 'dark' | 'light'
const headingStyle = {
    fontFamily: headingFont,
    color: `${grey[currentPalette === 'light' ? 900 : 100]} !important`,
}

const palettes = {
    light: {
        mode: 'light' as const,
        divider,
        primary: {
            main: '#6b9eff',
        },
        secondary: {
            main: '#9a7bd4',
        },
        background: {
            default: '#020307',
            paper: '#0a0c14',
        },
    },
    dark: {
        mode: 'dark' as const,
        divider,
        text: {
            primary: '#7f7f7f',
            secondary: '#8c8f9f',
        },
        primary: {
            main: '#6991de',
        },
        secondary: {
            main: '#9a7bd4',
        },
        background: {
            default: '#020307',
            paper: '#0a0c14',
        },
    },
}

const palette = palettes[currentPalette]
const theme = createTheme({
    palette,
    components: {
        MuiAvatar: {
            defaultProps: {
                imgProps: {
                    crossOrigin: 'anonymous',
                },
            },
        },
        MuiBackdrop: {
            styleOverrides: {
                root: supportsBackdropFilter
                    ? {
                          backgroundColor: 'transparent',
                          backdropFilter: 'blur(8px)',
                      }
                    : {},
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: palette.divider,
                },
            },
        },
        MuiPopover: {
            styleOverrides: {
                paper: supportsBackdropFilter
                    ? {
                          backdropFilter: 'blur(8px)',
                          backgroundColor: alpha(palette.background.paper, 0.8),
                      }
                    : {},
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: supportsBackdropFilter
                    ? {
                          backdropFilter: 'blur(8px)',
                          backgroundColor: alpha(palette.background.paper, 0.6),
                      }
                    : undefined,
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    textDecorationColor: 'transparent',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
    },
    typography: {
        h1: headingStyle,
        h2: headingStyle,
        h3: headingStyle,
        h4: headingStyle,
        h5: headingStyle,
        h6: headingStyle,
        fontFamily: defaultFont,
    },
})
