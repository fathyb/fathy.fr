import { createContext, PropsWithChildren, useContext } from 'react'

export interface TitleProvider {
    value: string
}

export function TitleProvider({
    value,
    children,
}: PropsWithChildren<{ value: TitleProvider }>) {
    return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useTitleProvider() {
    return useContext(Context)
}

const Context = createContext<null | TitleProvider>(null)
