import { useState, useCallback, type ReactNode } from 'react'
import { ImagesContext } from './imagesContext'

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

