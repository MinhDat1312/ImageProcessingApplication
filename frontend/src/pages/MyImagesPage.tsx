import { Empty, Pagination, Skeleton, Tabs, Badge } from 'antd'
import { useEffect, useState } from 'react'
import { ReloadOutlined, RocketOutlined, HeartFilled, LockOutlined, GlobalOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import axiosInstance from '../api/axiosInstance'
import { useImages } from '../context/useImages'
import { useAuth } from '../context/AuthContext'
import { ImageDetailModal } from '../components/ImageDetailModal'
import type { ApiResponse, ImageItem } from '../types'

interface GalleryItem extends ImageItem {
  prompt?: string
  likes?: number
  comments?: number
  views?: number
  likedByCurrentUser?: boolean
  owner?: {
    userId?: string
    username?: string
    avatar?: string
  }
}

interface ImagePageResponse {
  items: GalleryItem[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

const PAGE_SIZE = 9

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  if (diff < 0) return 'Just now'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US')
}

export function MyImagesPage() {
  const { refreshKey, triggerRefresh } = useImages()
  const { user } = useAuth()
  const [images, setImages] = useState<GalleryItem[]>([])
  const [total, setTotal] = useState(0)
  const [likedTotal, setLikedTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)
  const [activeTab, setActiveTab] = useState<'created' | 'liked'>('created')
  const navigate = useNavigate()

  const refreshImages = () => {
    triggerRefresh()
  }

  useEffect(() => {
    const controller = new AbortController()
    const fetchImages = async () => {
      setLoading(true)
      try {
        const endpoint = activeTab === 'created' ? '/api/v1/images/me' : '/api/v1/images/me/liked'
        const res = await axiosInstance.get<ApiResponse<ImagePageResponse>>(endpoint, {
          params: { page: page - 1, size: PAGE_SIZE },
          signal: controller.signal,
        })
        const responseData = res.data.data
        setImages(responseData?.items ?? [])
        setTotal(responseData?.totalItems ?? 0)
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching images:', err)
          setImages([])
          setTotal(0)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }
    fetchImages()
    return () => controller.abort()
  }, [page, refreshKey, activeTab])

  useEffect(() => {
    const controller = new AbortController()
    const fetchLikedTotal = async () => {
      try {
        const res = await axiosInstance.get<ApiResponse<ImagePageResponse>>('/api/v1/images/me/liked', {
          params: { page: 0, size: 1 },
          signal: controller.signal,
        })
        setLikedTotal(res.data.data?.totalItems ?? 0)
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching liked total:', err)
          setLikedTotal(0)
        }
      }
    }

    fetchLikedTotal()
    return () => controller.abort()
  }, [refreshKey])

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  // Format selected item for modal compatibility
  const getModalItem = () => {
    if (!selectedImage) return null
    return {
      id: selectedImage.id,
      url: selectedImage.url,
      prompt: selectedImage.prompt ?? '',
      likes: selectedImage.likes ?? 0,
      comments: selectedImage.comments ?? 0,
      views: selectedImage.views ?? 0,
      createdAt: selectedImage.createdAt,
      owner: {
        userId: selectedImage.owner?.userId || user?.userId || '',
        username: selectedImage.owner?.username || user?.username || 'Me',
        avatar: selectedImage.owner?.avatar || user?.avatar || '',
      },
      likedByCurrentUser: selectedImage.likedByCurrentUser ?? activeTab === 'liked',
      visibility: selectedImage.visibility,
      title: selectedImage.title ?? '',
      description: selectedImage.description ?? '',
      tags: selectedImage.tags ?? '',
    }
  }

  const modalItem = getModalItem()

  return (
    <div className="my-images-shell">
      <motion.div
        className="my-images-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <div>
            <span className="section-kicker">Gallery</span>
            <h1>{activeTab === 'created' ? 'My Creations' : 'Liked Images'}</h1>
            <p>
              {activeTab === 'created'
                ? (total > 0 ? `${total} processed images` : 'No images in your workspace yet')
                : (total > 0 ? `${total} liked images` : 'No liked images yet')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              icon={<RocketOutlined />}
              onClick={() => navigate('/')}
            >
              Open studio
            </Button>
            <Button
              variant="secondary"
              icon={<ReloadOutlined />}
              onClick={refreshImages}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>
 
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'created' | 'liked')}
        items={[
          { key: 'created', label: 'My Creations' },
          { key: 'liked', label: <span><HeartFilled style={{ color: '#ff4d6d' }} /> Liked <Badge count={likedTotal} style={{ marginLeft: 8, backgroundColor: '#ff4d6d' }} /></span> },
        ]}
      />
 
      {loading ? (
        <div className="images-grid">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton.Image key={i} active style={{ width: '100%', height: 200, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '48vh' }}>
          <Empty
            description={activeTab === 'created'
              ? "You haven't processed any images yet. Open the studio to create your first asset."
              : "You haven't liked any image yet. Explore and hit the heart to save favorites."}
            style={{ margin: 'var(--spacing-12) auto' }}
          >
            <Button variant="primary" icon={<RocketOutlined />} onClick={() => navigate('/')}>
              {activeTab === 'created' ? 'Go to studio' : 'Explore gallery'}
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="images-grid">
          {images.map(img => (
            <motion.div
              key={img.id}
              className="image-grid-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => setSelectedImage(img)}
              style={{ cursor: 'pointer' }}
            >
              <img src={img.url} alt={img.id} loading="lazy" />
              {img.visibility && (
                <div className="image-grid-item-visibility">
                  {img.visibility === 'PRIVATE' ? (
                    <LockOutlined style={{ color: '#ff4d6d' }} />
                  ) : (
                    <GlobalOutlined style={{ color: '#5E6AD2' }} />
                  )}
                  <span style={{ marginLeft: '4px', textTransform: 'capitalize', fontSize: '11px', fontWeight: 500 }}>
                    {img.visibility.toLowerCase()}
                  </span>
                </div>
              )}
              <div className="image-grid-item-overlay">{timeAgo(img.createdAt)}</div>
            </motion.div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="images-pagination">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}

      {modalItem && (
        <ImageDetailModal
          visible={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          item={modalItem}
          onUpdateLikes={(newLikes, isLiked) => {
            if (!selectedImage) return
            setLikedTotal(prev => {
              const delta = isLiked ? 1 : -1
              return Math.max(0, prev + (selectedImage.likedByCurrentUser === isLiked ? 0 : delta))
            })
            setImages(prev => {
              const updated = prev
                .map(img => img.id === selectedImage.id
                  ? { ...img, likes: newLikes, likedByCurrentUser: isLiked }
                  : img
                )

              if (activeTab === 'liked' && !isLiked) {
                const filtered = updated.filter(img => img.id !== selectedImage.id)
                setTotal(t => Math.max(0, t - 1))
                return filtered
              }
              return updated
            })
          }}
          onUpdateVisibility={(id, nextVisibility) => {
            if (!selectedImage) return
            setImages(prev => 
              prev.map(img => img.id === id ? { ...img, visibility: nextVisibility } : img)
            )
            setSelectedImage(prev => prev && prev.id === id ? { ...prev, visibility: nextVisibility } : prev)
          }}
          onUpdateMetadata={(id, updatedFields) => {
            if (!selectedImage) return
            setImages(prev => 
              prev.map(img => img.id === id ? { ...img, ...updatedFields } : img)
            )
            setSelectedImage(prev => prev && prev.id === id ? { ...prev, ...updatedFields } : prev)
          }}
        />
      )}
    </div>
  )
}
