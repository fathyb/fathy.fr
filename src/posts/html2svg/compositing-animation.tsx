import { Box, useTheme } from '@mui/material'
import { PropsWithChildren } from 'react'

import { useSequenceAnimation } from '../../components/sequence-animation'
import Code from './compositing-animation.mdx'

const slides = [
    <>
        <MainCanvas>
            <Fade>
                <ChocolatineGradient />
            </Fade>
        </MainCanvas>
        <Fade show>
            <TextSurface>
                <Fade>
                    <Chocolatine />
                </Fade>
            </TextSurface>
        </Fade>
    </>,
    <>
        <MainCanvas />
        <Fade show>
            <TextSurface>
                <Fade show>
                    <Chocolatine />
                </Fade>
            </TextSurface>
        </Fade>
        <Fade>
            <GradientSurface />
        </Fade>
    </>,
    <>
        <MainCanvas />
        <TextSurface>
            <Chocolatine />
        </TextSurface>
        <Fade show>
            <GradientSurface>
                <Fade>
                    <Gradient />
                </Fade>
            </GradientSurface>
        </Fade>
    </>,
    <>
        <MainCanvas />
        <Fade show>
            <TextSurface>
                <Fade show>
                    <Chocolatine />
                </Fade>
                <Fade>
                    <ChocolatineGradient />
                </Fade>
            </TextSurface>
        </Fade>
        <Fade show>
            <GradientSurface>
                <Fade show>
                    <Gradient />
                </Fade>
            </GradientSurface>
        </Fade>
    </>,
    <>
        <MainCanvas>
            <Fade>
                <ChocolatineGradient />
            </Fade>
        </MainCanvas>

        <Fade show>
            <TextSurface>
                <Fade>
                    <Chocolatine />
                </Fade>
                <Fade show>
                    <ChocolatineGradient />
                </Fade>
            </TextSurface>
        </Fade>

        <Fade>
            <GradientSurface>
                <Gradient />
            </GradientSurface>
        </Fade>
    </>,
    <>
        <MainCanvas>
            <Fade show>
                <ChocolatineGradient />
            </Fade>
        </MainCanvas>
        <Fade>
            <TextSurface>
                <ChocolatineGradient />
            </TextSurface>
        </Fade>
    </>,
]

export function CompositingAnimation() {
    const [child, ref, index] = useSequenceAnimation(slides, { interval: 500 })

    return (
        <Box
            ref={ref}
            className="align-right"
            sx={{
                clear: 'both',

                '& pre': {
                    padding: '0 !important',
                    marginTop: '0 !important',
                },
            }}
        >
            <Box
                mb={1}
                display="flex"
                flexDirection="row"
                justifyContent="stretch"
                alignItems="flex-start"
            >
                <Box component="pre" sx={{ lineHeight: 1.5 }}>
                    {Array(slides.length)
                        .fill(0)
                        .map((_, i) => (i === index ? '>' : ' '))
                        .join('\n')}
                </Box>
                <Code />
            </Box>

            <svg viewBox="0 100 572 256">{child}</svg>
        </Box>
    )
}

function MainCanvas({ children }: PropsWithChildren<{}>) {
    return (
        <>
            <g transform="translate(80 100) rotate(0 52 10)" fill="#ffffff">
                <text
                    x="0"
                    y="16"
                    fontSize="16px"
                    fontFamily="Inconsolata, Monaco, Consolas, Courier New, Courier, monospace"
                    textAnchor="start"
                    direction="ltr"
                >
                    Main canvas
                </text>
                <g transform="translate(-35, 75) scale(.25)">
                    <path d="m317.66 469.74 21.324 5.2656s18.238-1.4922 27.988-2.4375c9.7461-0.94531 6.5625-12.727 6.5625-12.727l-27.164-7.8789-17.105-2.3633s-19.219 4.2227-21.965 6.7109c-2.7422 2.4805 10.359 13.43 10.359 13.43z" />
                    <path d="m265.68 454.08c4.4688-1.7656 9.0312-4.6406 12.727-7.293 3.082-2.2109 1.8125-7.0547-1.9492-7.5312l-29.812-3.75s-21.586 7.5312-19.074 12.266c2.5078 4.7344 35.266 7.4336 38.109 6.3086z" />
                    <path d="m595.32 321.29c-3.7695-4.793-12.527-18.648-19.02-29.121 5.4023-7.3086-29.816-36.535-68.859-53.52-43.516-18.93-146.24-27.582-178.08-19.582-31.84 8-85.543 55.641-98.23 71.492-12.906 16.125-60.996 76.02-68.305 90.324-7.3086 14.309-10.668 37.219-6.2227 46.793 2.832 6.1055 8.4141 19.668 11.914 28.27 0 0-4.9766 0.80078-5.8906 3.168-0.91406 2.3711-2.5703 14.574-0.96484 17.758 1.6055 3.1875 147.25 42.617 168.71 43.223 20.805 0.58594 107.66-13.527 114.99-18.887 7.3359-5.3594 68.5-49.59 82.312-65.812 4.75-5.5781 14.766-14.645 25.887-24.375 20.223-17.703 44.09-37.605 46.531-42.766 3.7695-7.9922 1.7695-38.645-4.7734-46.965zm-6.6914 40.914c-2.4922 9.625-46.566 35.145-65.609 56.309-13.242 14.715-53.738 45.355-75.949 59.996 2.9492-8.6602 22.121-28.508 7.9141-46.121-25.254-8.6836-58.984-48.02-89.637-56.391-45.199-19.66-144.74-5.0703-144.74-5.0703l-4.2891 12.094s96.129-9.8516 142.67 6.2305c33.586 11.609 61.633 38.281 74.832 46.25 0.015626 0.015625 8.2695 3.4766 13.223 12.316 4.6328 8.2773-13.664 28.906-24.32 38.531-10.812 9.7656-73.621 16.316-95.172 14.855-21.457-1.4531-140.45-30.84-140.45-37.746l0.60547-2.5664c20.922 5.4922 118.66 31.262 150.05 31.578 49.285 0.49609 80.227-16.195 80.227-16.195s3.3906-11.008-1.7773-15.383c-17.465-14.801-52.086-21.906-73.699-32.449-11.969-5.8359-62.355-12.469-68.375-14.18-17.168-4.875-35.812-0.29297-52.047 3.7617-16.234 4.0547-20.445 17.477-20.445 17.477l8.0117 7.2109s10.434-10.844 17.707-13.441c7.2734-2.5938 24.867-7.9648 43.754-1.6211 14.695 4.9336 47.305 4.9688 57.371 9.8359 31.965 15.453 65.812 20.742 71.734 27.555 5.2383 6.0195-22.941 11.977-49.305 13.465-39.543 2.2266-143.97-25.895-151.88-29.945-3.7695-1.9336-10.609-22.559-5.3047-29.34 2.25-2.875 17.848-16.973 48.105-13.543 26.965 3.0547 59.699-2.1836 87.59 4.0273 17.883 3.9844 46.25 20.223 64.309 31.367 10.109 6.2383 27.742 17.215 27.742 17.215l9.7695-7.9102s-17.336-10.98-27.207-17.41c-19.41-12.637-51.535-32.16-71.344-36.824-31.809-7.4961-68.93-0.38281-96.184-4.7695-32.73-5.2656-54.922 17.402-57.602 20.113-5.3789 5.4453-0.67187 23.406 1.8086 31.469-0.046875-0.015625-0.10547-0.03125-0.14844-0.050781l-2.9492-1.25c-3.832-11.246-4.6016-15.758-5.9805-25.25-1.7773-12.223 4.3086-27.984 8.957-34.238 0 0 44.375-60.281 62.75-81.988 16.75-19.781 49.098-52.312 87.02-66.008 37.926-13.695 133.49 5.0312 164.57 17.168 22.527 8.8008 64.305 27.895 65.758 40.203 1.1367 9.6406 19.445 33.273 23.633 39.234 5 7.1289 5.5117 26.746 4.2969 31.43z " />
                </g>
            </g>
            <g
                transform="translate(10 128) rotate(0 130 107)"
                strokeLinecap="round"
            >
                <path
                    d="M2.205540542742491 -4.213014162967394 C84.0194331813902 9.144886617092853, 169.66067578817032 4.9969395347241035, 259.22512888537483 -2.3547705569663253 M-0.8901776173230885 -0.2683116925387849 C62.2151470185952 1.681485378498702, 125.49979503112843 4.051256308093137, 258.25206895035245 -1.9342548428610944 M262.0532129610599 -3.89779218698351 C251.84162835003298 65.52649645682109, 257.15536251176036 140.2121596962377, 254.95689668380575 209.76158408961058 M258.4407844316078 2.2123351898986976 C258.54192562763274 61.04614567930709, 254.45553316311276 128.18171762479375, 260.7369043539184 210.82423011528428 M257.7746641547618 211.2853850844869 C202.12060703598274 209.0189257525022, 140.72082013307673 213.70416409592812, -0.13105064194726448 209.32303466778845 M258.04652869926616 209.34721424122867 C192.5814250539765 215.48307902542692, 123.8008583319835 215.21789592662347, -0.41291391801647476 208.90087345100576 M4.857455470410277 211.94654490987693 C-2.5518890186347205 170.4837708637564, -1.106236268001573 124.38661979302023, -2.410465606707358 -1.385558329579169 M-1.7777110428710918 211.43551312397724 C-2.7060316947493974 165.84771876823743, -3.0731518618206994 117.23210662434732, 2.3509926914093233 1.8953426378604428"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                />
                <g transform="translate(5 5)">{children}</g>
            </g>
        </>
    )
}

function TextSurface({ children }: PropsWithChildren<{}>) {
    return (
        <>
            <g transform="translate(375 98) rotate(0 71 10)">
                <text
                    x="0"
                    y="16"
                    fill="#ffffff"
                    fontSize="16px"
                    direction="ltr"
                    fontFamily="Inconsolata, Monaco, Consolas, Courier New, Courier, monospace"
                    textAnchor="start"
                >
                    Text surface
                </text>
            </g>
            <g
                transform="translate(315 127) rotate(0 119 32)"
                strokeLinecap="round"
            >
                {children}
                <path
                    d="M-3.19 2.73 C91.52 -1.77, 184.83 -1.44, 240.48 -2.09 M0.43 -1.2 C93.75 3.59, 190.55 1.8, 239.63 1.22 M236.42 1.82 C241.42 23.03, 238.97 49.57, 242.78 64.02 M240.19 -0.81 C239.33 18.65, 237.93 38.9, 241.29 65.54 M238.02 62.68 C166.96 59.53, 91.09 60.04, 0.08 63.34 M240.28 64.59 C159.94 63.31, 81.11 65.26, -1.35 64.58 M-1.39 62.23 C3.88 44.24, 3.53 32.53, -1.79 -2.67 M0.52 64.48 C-0.58 50.72, -1.38 37.91, 0.38 -1.82"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1"
                />
            </g>
        </>
    )
}

function GradientSurface({
    children,
    fill = 'none',
}: PropsWithChildren<{ fill?: string }>) {
    return (
        <>
            <g transform="translate(360 220) rotate(0 52 10)">
                <text
                    x="0"
                    y="16"
                    fill="#ffffff"
                    fontSize="16px"
                    textAnchor="start"
                    fontFamily="Inconsolata, Monaco, Consolas, Courier New, Courier, monospace"
                    direction="ltr"
                >
                    Gradient surface
                </text>
            </g>
            <g
                transform="translate(323 254) rotate(0 119 32)"
                strokeLinecap="round"
            >
                {children}
                <path
                    d="M2.58 2.17 C59.65 4.22, 123.73 2.71, 238.07 -2.2 M-1.6 0.52 C95.86 1.93, 190.16 -0.41, 238.85 1.53 M239.47 -0.36 C241.06 18.31, 242.67 44.41, 236.19 66.86 M239.68 0.37 C238.81 16.4, 239.49 28.42, 237.58 63.94 M239.08 63.55 C175.79 62.39, 116.4 66.66, -0.1 67.41 M237.84 64.49 C176.12 64.73, 108.67 63.51, -1.02 63.87 M-2.36 63.59 C2.89 44.12, -0.19 19.02, -3.97 -2.46 M-1.42 63.53 C-0.54 45.51, -0.73 28.17, -1.54 1.7"
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth="1"
                />
            </g>
        </>
    )
}

function Gradient() {
    return (
        <>
            <defs>
                <linearGradient
                    x1="0"
                    y1="0"
                    x2="241"
                    y2="0"
                    id="linear-gradient"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(521 643)"
                >
                    <stop offset="0" stopColor="#007FFF" />
                    <stop offset="1" stopColor="#0059B2" />
                </linearGradient>
            </defs>
            <rect fill="url(#linear-gradient)" width="241" height="66" />
        </>
    )
}

function Chocolatine({ fill = 'white' }: { fill?: string }) {
    return (
        <text
            x="25"
            y="40"
            fontSize="36px"
            direction="ltr"
            textAnchor="start"
            fill={fill}
            fontFamily="Virgil, Trebuchet MS, Arial"
        >
            chocolatine
        </text>
    )
}

function ChocolatineGradient() {
    return (
        <>
            <defs>
                <Gradient />
            </defs>
            <Chocolatine fill="url(#linear-gradient)" />
        </>
    )
}

function Fade({
    children,
    show = false,
}: PropsWithChildren<{ show?: boolean }>) {
    const theme = useTheme()

    return (
        <g
            style={{
                opacity: show ? 1 : 0,
                transition: theme.transitions.create('opacity', {
                    duration: 200,
                }),
            }}
        >
            {children}
        </g>
    )
}
