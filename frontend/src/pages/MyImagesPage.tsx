import { Empty, Pagination, Skeleton } from 'antd'
import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import type { ImageItem } from '../types'

interface ImagePageResponse {
  items: ImageItem[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

export function MyImagesPage() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const PAGE_SIZE = 9

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true)
      try {
        const res = await axiosInstance.get<ImagePageResponse>('/api/images/mine', {
          params: { page: page - 1, size: PAGE_SIZE },
        })
        setImages(res.data.items)
        setTotal(res.data.totalItems)
      } catch {
        setImages([])
      } finally {
        setLoading(false)
      }
    }
    fetchImages()
  }, [page])

  return (
    <div className="my-images-shell">
      <div className="my-images-header">
        <h1>Ảnh của tôi</h1>
        <p>{total > 0 ? `${total} ảnh đã xử lý` : 'Chưa có ảnh nào'}</p>
      </div>

      {loading ? (
        <div className="images-grid">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton.Image key={i} active style={{ width: '100%', height: 200, borderRadius: 12 }} />
          ))}
        </div>
      ) : images.length === 0 ? (
        <Empty
          description="Bạn chưa xử lý ảnh nào. Hãy thử pipeline ngay!"
          style={{ margin: '48px auto' }}
        />
      ) : (
        <div className="images-grid">
          {images.map(img => (
            <div key={img.id} className="image-grid-item">
              <img src={img.url} alt={img.id} loading="lazy" />
              <div className="image-grid-item-overlay">{timeAgo(img.createdAt)}</div>
            </div>
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
    </div>
  )
}
