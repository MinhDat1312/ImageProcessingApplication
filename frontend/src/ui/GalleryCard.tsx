import { HeartOutlined, MessageOutlined, EyeOutlined, StarOutlined, ShareAltOutlined } from '@ant-design/icons'
import { Button, Avatar } from 'antd'
import { motion } from 'framer-motion'
import type { ImageItem } from '../types'

interface GalleryCardProps {
  item: ImageItem & { prompt?: string; likes?: number; comments?: number; views?: number; owner?: { username?: string; avatar?: string } }
}

export default function GalleryCard({ item }: GalleryCardProps) {
  return (
    <motion.article
      className="gallery-card glass-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="gallery-image-wrap">
        <img src={item.url} alt={item.id} loading="lazy" style={{ width: '100%', display: 'block', borderRadius: 12 }} />
      </div>
      <div className="gallery-card-body">
        <p className="prompt-preview" title={item.prompt}>{item.prompt ?? '—'}</p>
        <div className="gallery-meta">
          <div className="creator">
            <Avatar size={28} src={item.owner?.avatar || undefined}>{item.owner?.username?.slice(0,2)}</Avatar>
            <div className="creator-name">{item.owner?.username ?? 'Anonymous'}</div>
          </div>
          <div className="actions">
            <Button type="text" icon={<HeartOutlined />}>{item.likes ?? 0}</Button>
            <Button type="text" icon={<MessageOutlined />}>{item.comments ?? 0}</Button>
            <Button type="text" icon={<EyeOutlined />}>{item.views ?? 0}</Button>
            <Button type="text" icon={<StarOutlined />} />
            <Button type="text" icon={<ShareAltOutlined />} />
          </div>
        </div>
      </div>
    </motion.article>
  )
}
