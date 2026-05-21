import { useContext } from 'react'
import { ImagesContext } from './imagesContext'

export function useImages() {
  const ctx = useContext(ImagesContext)
  if (!ctx) throw new Error('useImages must be used within ImagesProvider')
  return ctx
}