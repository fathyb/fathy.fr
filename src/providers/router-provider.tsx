import { Router } from 'react-router'
import { BrowserRouterProps } from 'react-router-dom'
import { createBrowserHistory, BrowserHistory } from 'history'
import {
    useLayoutEffect,
    useRef,
    useState,
    createContext,
    PropsWithChildren,
    TransitionStartFunction,
    useContext,
    useTransition,
} from 'react'

export function useGlobalTransition(): [boolean, TransitionStartFunction] {
    const context = useContext(Context)

    if (context) {
        return [context.pending, context.startTransition]
    } else {
        throw new Error('No TransitionContext found')
    }
}

export function RouterProvider({
    children,
    ...props
}: PropsWithChildren<BrowserRouterProps>) {
    const [pending, startTransition] = useTransition()

    return (
        <Context.Provider value={{ pending, startTransition }}>
            <SuspenseRouter {...props}>{children}</SuspenseRouter>
        </Context.Provider>
    )
}

const Context = createContext<null | {
    pending: boolean
    startTransition: TransitionStartFunction
}>(null)

function SuspenseRouter({ basename, children, window }: BrowserRouterProps) {
    const historyRef = useRef<BrowserHistory | null>(null)

    if (historyRef.current == null) {
        historyRef.current = createBrowserHistory({ window })
    }

    const history = historyRef.current
    const [, startTransition] = useGlobalTransition()
    const [state, setState] = useState({
        action: history.action,
        location: history.location,
    })

    useLayoutEffect(
        () => history.listen((next) => startTransition(() => setState(next))),
        [history],
    )

    return (
        <Router
            basename={basename}
            location={state.location}
            navigator={history}
            navigationType={state.action}
        >
            {children}
        </Router>
    )
}
