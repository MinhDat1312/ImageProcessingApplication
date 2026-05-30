import { HeartOutlined, HeartFilled, MessageOutlined, EyeOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'
import { Button } from '../components/ui/Button'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { ImageItem } from '../types'
import { ImageDetailModal } from '../components/ImageDetailModal'

interface GalleryCardProps {
  item: ImageItem & { 
    prompt?: string; 
    likes?: number; 
    comments?: number; 
    views?: number; 
    owner?: { userId?: string; username?: string; avatar?: string };
    likedByCurrentUser?: boolean;
  }
}

export default function GalleryCard({ item }: GalleryCardProps) {
  const navigate = useNavigate()
  const [modalVisible, setModalVisible] = useState(false)
  const [likes, setLikes] = useState(item.likes ?? 0)
  const [comments, setComments] = useState(item.comments ?? 0)
  const [liked, setLiked] = useState(item.likedByCurrentUser ?? false)

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.owner?.userId) {
      navigate(`/profile/${item.owner.userId}`)
    }
  }

  const handleCardClick = () => {
    setModalVisible(true)
  }

  // Ensure owner details exist to satisfy type constraints in modal
  const modalItem = {
    id: item.id,
    url: item.url,
    prompt: item.prompt,
    likes: likes,
    comments: comments,
    views: item.views ?? 0,
    createdAt: item.createdAt || new Date().toISOString(),
    owner: {
      userId: item.owner?.userId || '',
      username: item.owner?.username || 'Anonymous',
      avatar: item.owner?.avatar || '',
    },
    likedByCurrentUser: liked,
  }

  return (
    <>
      <motion.article
        className="gallery-card glass-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        whileHover={{ scale: 1.01 }}
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
          <div className="gallery-image-wrap">
            <img src={item.url} alt={item.id} loading="lazy" />
          </div>
        <div className="gallery-card-body">
          <p className="prompt-preview" title={item.prompt}>{item.prompt ?? '—'}</p>
          <div className="gallery-meta">
            <div 
              className="creator" 
              onClick={handleProfileClick} 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
            >
              <Avatar size={28} src={item.owner?.avatar || undefined}>{item.owner?.username?.slice(0,2)}</Avatar>
            </div>
            <div className="actions" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                icon={liked ? <HeartFilled style={{ color: '#ff0055' }} /> : <HeartOutlined />}
                onClick={async (e) => {
                  e.stopPropagation()
                  // Simple trigger using modal handle like toggle logic or letting modal handle it
                  setModalVisible(true)
                }}
              >
                {likes}
              </Button>
              <Button variant="ghost" icon={<MessageOutlined />}>{comments}</Button>
              <Button variant="ghost" icon={<EyeOutlined />}>{item.views ?? 0}</Button>
            </div>
          </div>
        </div>
      </motion.article>

      <ImageDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        item={modalItem}
        onUpdateLikes={(newLikes, isLiked) => {
          setLikes(newLikes)
          setLiked(isLiked)
        }}
        onUpdateComments={(newComments) => {
          setComments(newComments)
        }}
      />
    </>
  )
}
