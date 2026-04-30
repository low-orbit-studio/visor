"use client"

import * as React from "react"

export type PasswordManagersValue = "ignore" | "allow"

const PasswordManagersContext = React.createContext<
  PasswordManagersValue | undefined
>(undefined)

export interface PasswordManagersProviderProps {
  value: PasswordManagersValue
  children: React.ReactNode
}

export function PasswordManagersProvider({
  value,
  children,
}: PasswordManagersProviderProps) {
  return (
    <PasswordManagersContext.Provider value={value}>
      {children}
    </PasswordManagersContext.Provider>
  )
}

export function usePasswordManagersContext(): PasswordManagersValue | undefined {
  return React.useContext(PasswordManagersContext)
}

export function usePasswordManagersValue(
  prop?: PasswordManagersValue
): PasswordManagersValue {
  const fromContext = usePasswordManagersContext()
  return prop ?? fromContext ?? "ignore"
}
