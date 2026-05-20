import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ImagesContextValue {
  refreshKey: number
  triggerRefresh: () => void
}

const ImagesContext = createContext<ImagesContextValue | null>(null)

export function ImagesProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <ImagesContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </ImagesContext.Provider>
  )
}

export function useImages() {
  const ctx = useContext(ImagesContext)
  if (!ctx) throw new Error('useImages must be used within ImagesProvider')
  return ctx
}
