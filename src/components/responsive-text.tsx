import { PropsWithChildren, SVGProps, useRef } from 'react'

export function ResponsiveText({
    width,
    height,
    children,
    ...props
}: PropsWithChildren<
    SVGProps<SVGTextElement> & {
        width: number
        height: number
    }
>) {
    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
            <text
                key={Date.now()}
                {...props}
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
            >
                {children}
            </text>
        </svg>
    )
}
