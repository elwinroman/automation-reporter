import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface VersionContextValue {
  version: string | null;
  setVersion: (v: string) => void;
  clearVersion: () => void;
}

const VersionContext = createContext<VersionContextValue | null>(null)

export function VersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<string | null>(null)

  const setVersion = useCallback((v: string) => {
    setVersionState(v)
  }, [])

  const clearVersion = useCallback(() => {
    setVersionState(null)
  }, [])

  return (
    <VersionContext.Provider value={{ version, setVersion, clearVersion }}>
      {children}
    </VersionContext.Provider>
  )
}

export function useVersion() {
  const ctx = useContext(VersionContext)
  if (!ctx) throw new Error('useVersion must be used within VersionProvider')
  return ctx
}
