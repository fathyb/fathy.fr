import { useLocation } from 'react-router'
import { forwardRef, useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Link as MaterialLink, LinkProps } from '@mui/material'

import { useFunction } from '../hooks/use-function'

export interface Props extends LinkProps {
    to?: string
    button?: boolean
    external?: boolean
}

export const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
    {
        to,
        button,
        external = to
            ? to.startsWith('http://') ||
              to.startsWith('https://') ||
              to.startsWith('mailto:') ||
              to.endsWith('.xml')
            : true,
        ...props
    }: Props,
    ref,
) {
    const { pathname } = useLocation()
    const url = to
        ? new URL(
              to,
              new URL(
                  pathname,
                  typeof location === 'undefined'
                      ? 'http://localhost'
                      : location.href,
              ),
          )
        : null
    const style = useMemo(
        () => ({
            cursor: 'pointer',
            textDecoration: button ? 'none' : undefined,
            ...(props.style ?? {}),
        }),
        [button, props.style],
    )
    const onClick = useFunction(
        (
            e:
                | React.MouseEvent<HTMLSpanElement, MouseEvent>
                | React.MouseEvent<HTMLAnchorElement, MouseEvent>,
        ) => {
            if (url) {
                const target = url.hash
                    ? document.querySelector(url.hash)
                    : null

                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' })
                }
            }

            return props.onClick?.(e)
        },
    )

    return url && external ? (
        <MaterialLink
            ref={ref}
            {...props}
            style={style}
            href={to ?? pathname}
            target="_blank"
        >
            {props.children}
        </MaterialLink>
    ) : (
        <MaterialLink
            ref={ref}
            to={url ? url.pathname + url.hash : pathname}
            replace={url?.hash ? url.pathname === pathname : false}
            component={RouterLink}
            {...props}
            style={style}
            onClick={onClick}
        >
            {props.children}
        </MaterialLink>
    )
})
