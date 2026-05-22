import { useEffect, useState } from 'react'
import { Modal, Button, Input, Avatar, List, message, Divider } from 'antd'
import { 
  HeartOutlined, HeartFilled, MessageOutlined, EyeOutlined, 
  DownloadOutlined, SendOutlined, RocketOutlined 
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axiosInstance'

interface ImageDetailModalProps {
  visible: boolean
  onClose: () => void
  item: {
    id: string
    url: string
    prompt?: string
    likes?: number
    comments?: number
    views?: number
    createdAt: string
    owner: {
      userId: string
      username: string
      avatar: string
    }
    likedByCurrentUser?: boolean
  }
  onUpdateLikes?: (newLikes: number, liked: boolean) => void
  onUpdateComments?: (newComments: number) => void
}

interface CommentItem {
  id: string
  user: {
    id: string
    username: string
    avatar: string
  } | null
  content: string
  createdAt: string
}

export function ImageDetailModal({ visible, onClose, item, onUpdateLikes, onUpdateComments }: ImageDetailModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [likes, setLikes] = useState(item.likes ?? 0)
  const [views, setViews] = useState(item.views ?? 0)
  const [commentsCount, setCommentsCount] = useState(item.comments ?? 0)
  const [liked, setLiked] = useState(item.likedByCurrentUser ?? false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (visible && item.id) {
      // Sync local state
      setLikes(item.likes ?? 0)
      setViews(item.views ?? 0)
      setCommentsCount(item.comments ?? 0)
      setLiked(item.likedByCurrentUser ?? false)
      setNewComment('')
      
      // Increment views
      axiosInstance.post(`/api/v1/images/${item.id}/view`)
        .then(res => {
          if (res.data?.views !== undefined) {
            setViews(res.data.views)
          }
        })
        .catch(err => console.error('Failed to increment view', err))

      // Load comments
      fetchComments()
    }
  }, [visible, item.id])

  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const res = await axiosInstance.get(`/api/v1/images/${item.id}/comments`)
      // Support multiple response shapes: { items: [...] } or { data: { items: [...] } } or array
      const payload = res.data ?? {}
      let rawItems: any[] = []
      if (Array.isArray(payload)) rawItems = payload
      else if (Array.isArray(payload.items)) rawItems = payload.items
      else if (payload.data && Array.isArray(payload.data.items)) rawItems = payload.data.items
      else rawItems = []

      // Normalize comment shape to CommentItem
      const normalized = rawItems.map((it: any) => ({
        id: it.id ?? it.commentId ?? String(Math.random()),
        user: it.user ? { id: it.user.userId || it.user.id, username: it.user.username || it.user.name, avatar: it.user.avatar } : (it.owner ? { id: it.owner.userId, username: it.owner.username, avatar: it.owner.avatar } : null),
        content: it.content ?? it.body ?? it.text ?? '',
        createdAt: it.createdAt ?? it.created_at ?? it.timestamp ?? new Date().toISOString(),
      }))

      setComments(normalized)
    } catch (err) {
      console.error('Failed to load comments', err)
      // Surface a friendly message to the UI so users can retry
      const messageText = (err as any)?.response?.data?.error || (err as Error).message || 'Failed to load comments'
      setCommentsError(messageText)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLikeToggle = async () => {
    if (!user) {
      message.warning('Please sign in to like creations')
      return
    }

    try {
      const res = await axiosInstance.post(`/api/v1/images/${item.id}/like`)
      const newLikesCount = typeof res.data?.likes === 'number' ? res.data.likes : (liked ? Math.max(0, likes - 1) : likes + 1)
      const newLikedState = typeof res.data?.liked === 'boolean' ? res.data.liked : !liked

      setLikes(newLikesCount)
      setLiked(newLikedState)
      if (onUpdateLikes) onUpdateLikes(newLikesCount, newLikedState)
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to toggle like'
      message.error(errorMsg)
    }
  }

  const handleSendComment = async () => {
    if (!user) {
      message.warning('Please sign in to comment')
      return
    }
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const res = await axiosInstance.post(`/api/v1/images/${item.id}/comment`, { content: newComment.trim() })
      const newCommentsCount = res.data?.comments ?? (commentsCount + 1)
      setCommentsCount(newCommentsCount)
      setNewComment('')
      message.success('Comment posted successfully')
      fetchComments()
      if (onUpdateComments) onUpdateComments(newCommentsCount)
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to post comment'
      message.error(errorMsg)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDownload = async () => {
    try {
      message.info('Preparing your download...')
      const res = await fetch(item.url)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `novacanvas-creation-${item.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      window.open(item.url, '_blank')
    }
  }

  const handleRemix = () => {
    onClose()
    navigate('/studio', { state: { imageUrl: item.url } })
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      className="image-detail-modal"
      bodyStyle={{ padding: 0 }}
      destroyOnClose
    >
      <div className="detail-modal-layout">
        {/* Left pane: Image & prompt detail */}
        <div className="detail-modal-image-pane">
          <div className="detail-modal-image-container">
            <img src={item.url} alt={item.prompt || 'Creation'} />
          </div>
          <div className="detail-modal-meta-bar">
            {item.prompt && (
              <div className="prompt-display-box">
                <span className="prompt-label">Prompt</span>
                <p className="prompt-text">{item.prompt}</p>
              </div>
            )}
            <div className="modal-actions-footer">
              <Button 
                type="primary" 
                icon={<RocketOutlined />} 
                onClick={handleRemix}
                className="btn-remix-glow"
              >
                Remix in Studio
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Right pane: creator info, stats & comments */}
        <div className="detail-modal-sidebar">
          <div className="creator-profile-header">
            <Avatar 
              size={40} 
              src={item.owner.avatar || undefined}
              className="creator-avatar"
            >
              {item.owner.username.slice(0, 2).toUpperCase()}
            </Avatar>
            <div className="creator-info">
              <h4>{item.owner.username}</h4>
              <span>Published {new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Quick metrics */}
          <div className="modal-metrics-row">
            <div className={`metric-badge ${liked ? 'liked' : ''}`} onClick={handleLikeToggle}>
              {liked ? <HeartFilled style={{ color: '#ff0055' }} /> : <HeartOutlined />}
              <span>{likes} Likes</span>
            </div>
            <div className="metric-badge">
              <EyeOutlined />
              <span>{views} Views</span>
            </div>
            <div className="metric-badge">
              <MessageOutlined />
              <span>{commentsCount} Comments</span>
            </div>
          </div>

          <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Comments section */}
          <div className="modal-comments-container">
            <h5>Comments</h5>
            {commentsError ? (
              <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <div>Failed to load comments: {commentsError}</div>
                <Button type="link" onClick={() => { setCommentsError(null); fetchComments(); }}>Retry</Button>
              </div>
            ) : (
              <List
                loading={loadingComments}
                dataSource={comments}
                locale={{ emptyText: 'No comments yet. Start the conversation!' }}
                renderItem={(c: CommentItem) => (
                  <List.Item className="comment-list-item">
                    <List.Item.Meta
                      avatar={
                        <Avatar src={c.user?.avatar || undefined}>
                          {c.user?.username?.slice(0, 2).toUpperCase() || 'AN'}
                        </Avatar>
                      }
                      title={
                        <div className="comment-user-meta">
                          <span className="comment-username">{c.user?.username || 'Anonymous'}</span>
                          <span className="comment-time">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      }
                      description={<p className="comment-content-text">{c.content}</p>}
                    />
                  </List.Item>
                )}
              />
            )}
          </div>

          {/* Send comment section */}
          <div className="modal-comment-input-area">
            <Input.TextArea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={user ? "Write a comment..." : "Sign in to leave a comment"}
              disabled={!user || submittingComment}
              autoSize={{ minRows: 2, maxRows: 3 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handleSendComment()
                }
              }}
            />
            <div className="comment-submit-row">
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                loading={submittingComment}
                disabled={!user || !newComment.trim()}
                onClick={handleSendComment}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
