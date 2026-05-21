import { useCallback, useEffect, useRef, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import type { ApiResponse, ImageItem } from '../types'
import GalleryCard from './GalleryCard'
import { Skeleton } from 'antd'

interface FeedItem extends ImageItem {
  prompt?: string
  likes?: number
  comments?: number
  views?: number
  owner?: { username?: string; avatar?: string }
}

interface FeedPageApiItem {
  id?: string
  imageId?: string
  url?: string
  createdAt?: string
  prompt?: string
  likes?: number
  comments?: number
  views?: number
  owner?: { username?: string; avatar?: string }
  user?: { username?: string; avatar?: string }
  username?: string
}

interface FeedPageResponse {
  items: FeedPageApiItem[]
  page: number
  size: number
}

export default function HomeFeed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true)
    try {
      // try public feed first, fallback to /me
      const resp = await axiosInstance.get<ApiResponse<FeedPageResponse>>('/api/v1/images/public', { params: { page: p, size: 12 } }).catch(async () => {
        return axiosInstance.get<ApiResponse<FeedPageResponse>>('/api/v1/images/me', { params: { page: p, size: 12 } })
      })

      const data = resp.data.data
      const newItems = (data.items ?? []).map((it: FeedPageApiItem) => ({
        id: it.id || it.imageId || '',
        url: it.url || '',
        createdAt: it.createdAt || new Date().toISOString(),
        prompt: it.prompt,
        likes: it.likes ?? Math.floor(Math.random() * 128),
        comments: it.comments ?? Math.floor(Math.random() * 24),
        views: it.views ?? Math.floor(Math.random() * 400),
        owner: it.owner ?? it.user ?? { username: it.username },
      }))
      setItems(prev => [...prev, ...newItems])
      setHasMore((data.items?.length ?? 0) > 0)
    } catch (err) {
      console.error('Feed fetch failed', err)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPage(page)
  }, [page, fetchPage])

  useEffect(() => {
    if (!loaderRef.current) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) setPage(p => p + 1)
    }, { rootMargin: '400px' })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading])

  return (
    <section>
      <div className="masonry">
        {items.map(item => (
          <GalleryCard key={item.id} item={item} />
        ))}
      </div>

      {loading && (
        <div className="masonry">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="gallery-skeleton"><Skeleton.Image active style={{ width: '100%', height: 220, borderRadius: 12 }} /></div>
          ))}
        </div>
      )}

      <div ref={loaderRef} style={{ height: 1 }} />
    </section>
  )
}
