import { createContext } from 'react'

export interface ImagesContextValue {
  refreshKey: number
  triggerRefresh: () => void
}

export const ImagesContext = createContext<ImagesContextValue | null>(null)