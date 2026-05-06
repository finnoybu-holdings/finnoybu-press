'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type Ctx = {
  open: boolean
  setOpen: (v: boolean) => void
}

const AuthModalContext = createContext<Ctx | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <AuthModalContext.Provider value={{ open, setOpen }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    // Allow callers in non-wrapped contexts (tests, isolated previews)
    // to no-op rather than crash.
    return { open: false, setOpen: () => {} }
  }
  return ctx
}
