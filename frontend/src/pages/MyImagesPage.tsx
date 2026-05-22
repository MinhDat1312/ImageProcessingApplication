import { Empty, Pagination, Skeleton, Button } from 'antd'
import { useEffect, useState } from 'react'
import { ReloadOutlined, RocketOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useImages } from '../context/useImages'
import { useAuth } from '../context/AuthContext'
import { ImageDetailModal } from '../components/ImageDetailModal'
import type { ApiResponse, ImageItem } from '../types'

interface ImagePageResponse {
  items: ImageItem[]
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
  const [images, setImages] = useState<ImageItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const navigate = useNavigate()

  const refreshImages = () => {
    triggerRefresh()
  }

  useEffect(() => {
    const controller = new AbortController()
    const fetchImages = async () => {
      setLoading(true)
      try {
        const res = await axiosInstance.get<ApiResponse<ImagePageResponse>>('/api/v1/images/me', {
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
  }, [page, refreshKey])

  // Format selected item for modal compatibility
  const getModalItem = () => {
    if (!selectedImage) return null
    return {
      id: selectedImage.id,
      url: selectedImage.url,
      prompt: '',
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: selectedImage.createdAt,
      owner: {
        userId: user?.userId || '',
        username: user?.username || 'Me',
        avatar: user?.avatar || '',
      },
      likedByCurrentUser: false,
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <span className="section-kicker">Gallery</span>
            <h1>My Creations</h1>
            <p>{total > 0 ? `${total} processed images` : 'No images in your workspace yet'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              icon={<RocketOutlined />}
              onClick={() => navigate('/')}
            >
              Open studio
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshImages}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="images-grid">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton.Image key={i} active style={{ width: '100%', height: 200, borderRadius: 12 }} />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '48vh' }}>
          <Empty
            description="You haven't processed any images yet. Open the studio to create your first asset."
            style={{ margin: '48px auto' }}
          >
            <Button type="primary" icon={<RocketOutlined />} onClick={() => navigate('/')}>
              Go to studio
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
        />
      )}
    </div>
  )
}
