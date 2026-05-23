import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Avatar, Empty, Form, Modal, Radio, Skeleton, Space, Tag, Upload, message } from 'antd'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { UploadFile } from 'antd'
import { EditOutlined, UserOutlined, MailOutlined, CalendarOutlined, UploadOutlined, CompassOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import type { ApiResponse, UserResponse } from '../types'
import GalleryCard from '../ui/GalleryCard'

interface ProfileImagesResponse {
  items: Array<{
    id: string
    url: string
    createdAt: string
    prompt?: string
    likes?: number
    comments?: number
    views?: number
    ownerId?: string
    ownerName?: string
    ownerAvatar?: string
  }>
  page: number
  size: number
  totalItems: number
  totalPages: number
}

interface ProfileImageItem {
  id: string
  url: string
  createdAt: string
  prompt?: string
  likes: number
  comments: number
  views: number
  owner: {
    userId: string
    username: string
    avatar: string
  }
}

interface EditProfileFormValues {
  username: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  bio: string
}

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser, setUser: setCurrentUser } = useAuth()
  const navigate = useNavigate()
  
  const [profileUser, setProfileUser] = useState<UserResponse | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [images, setImages] = useState<ProfileImageItem[]>([])
  const [loadingImages, setLoadingImages] = useState(true)
  
  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [updating, setUpdating] = useState(false)

  const isOwnProfile = !userId || userId === currentUser?.userId
  const targetUserId = userId || currentUser?.userId

  useEffect(() => {
    document.title = 'Goat Image AI — User Profile'
  }, [])

  // Fetch Profile and Images
  useEffect(() => {
    if (!targetUserId) {
      setLoadingProfile(false)
      setLoadingImages(false)
      return
    }

    const fetchProfile = async () => {
      setLoadingProfile(true)
      try {
        const res = await axiosInstance.get<ApiResponse<UserResponse>>(`/api/v1/auth/users/${targetUserId}`)
        setProfileUser(res.data.data)
      } catch (err) {
        console.error('Error fetching user profile:', err)
        message.error('Failed to load user profile')
      } finally {
        setLoadingProfile(false)
      }
    }

    const fetchUserImages = async () => {
      setLoadingImages(true)
      try {
        // Fetch public images of this specific user
        const res = await axiosInstance.get<ApiResponse<ProfileImagesResponse>>(`/api/v1/images/user/${targetUserId}`)
        const items = (res.data.data.items ?? []).map(it => ({
          id: it.id,
          url: it.url,
          createdAt: it.createdAt,
          prompt: it.prompt,
          likes: it.likes ?? 0,
          comments: it.comments ?? 0,
          views: it.views ?? 0,
          owner: {
            userId: it.ownerId || targetUserId,
            username: it.ownerName || profileUser?.username || 'User',
            avatar: it.ownerAvatar || profileUser?.avatar || '',
          }
        }))
        setImages(items)
      } catch (err) {
        console.error('Error fetching user images:', err)
      } finally {
        setLoadingImages(false)
      }
    }

    fetchProfile()
    fetchUserImages()
  }, [targetUserId])

  // Set form fields when edit modal opens
  const handleOpenEditModal = () => {
    if (!profileUser) return
    form.setFieldsValue({
      username: profileUser.username,
      gender: profileUser.gender,
      bio: profileUser.bio || '',
    })
    setFileList([])
    setIsEditModalOpen(true)
  }

  // Handle Save
  const handleSaveProfile = async (values: EditProfileFormValues) => {
    setUpdating(true)
    const formData = new FormData()
    formData.append('username', values.username)
    formData.append('gender', values.gender)
    formData.append('bio', values.bio)
    
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('avatar', fileList[0].originFileObj)
    }

    try {
      const res = await axiosInstance.put<ApiResponse<UserResponse>>('/api/v1/auth/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updatedUser = res.data.data
      
      setProfileUser(updatedUser)
      
      // If it's the current user, update context state
      if (currentUser && currentUser.userId === updatedUser.userId) {
        setCurrentUser({
          ...currentUser,
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          gender: updatedUser.gender,
        })
      }
      
      message.success('Profile updated successfully!')
      setIsEditModalOpen(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      message.error((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    // Keep only the most recent file
    setFileList(newFileList.slice(-1))
  }

  if (loadingProfile) {
    return (
      <div className="profile-shell profile-shell--loading">
        <Skeleton active avatar paragraph={{ rows: 4 }} />
        <Skeleton active className="profile-skeleton-body" />
      </div>
    )
  }

  if (!profileUser && !targetUserId) {
    return (
      <div className="profile-shell profile-shell--empty">
        <Empty description="No profile found. Please sign in first.">
          <Button variant="primary" onClick={() => navigate('/login')}>Sign In</Button>
        </Empty>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="profile-shell">
      <motion.section
        className="profile-hero glass-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="profile-hero-content">
          <div className="profile-avatar-wrapper">
            <Avatar
              size={120}
              src={profileUser?.avatar || undefined}
              icon={<UserOutlined />}
              className="profile-avatar"
            >
              {!profileUser?.avatar && profileUser?.username?.slice(0, 2).toUpperCase()}
            </Avatar>
          </div>
          
          <div className="profile-info-details">
            <div className="profile-name-row">
              <h1>{profileUser?.username}</h1>
              <Tag color="purple" className="profile-role-tag">
                {profileUser?.role?.name || 'User'}
              </Tag>
            </div>
            
            <p className="profile-bio">
              {profileUser?.bio || (isOwnProfile ? 'Add a bio to tell the community about yourself.' : 'No bio written yet.')}
            </p>
            
            <div className="profile-meta-chips">
              <span className="profile-meta-item">
                <MailOutlined /> {profileUser?.email}
              </span>
              <span className="profile-meta-item">
                <CalendarOutlined /> Joined {profileUser?.createdAt ? formatDate(profileUser.createdAt) : 'Recently'}
              </span>
            </div>
          </div>
          
          <div className="profile-actions-wrapper">
            {isOwnProfile ? (
              <Button variant="primary"
                icon={<EditOutlined />}
                onClick={handleOpenEditModal}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant="secondary" icon={<CompassOutlined />}
                onClick={() => navigate('/')}
              >
                Go to Studio
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      <section className="profile-gallery-section">
        <div className="section-header">
          <div>
            <span className="section-kicker">Creations</span>
            <h2>{isOwnProfile ? 'My Public Gallery' : `${profileUser?.username}'s Gallery`}</h2>
            <p>Discover processed works and generated prompt designs published to the community feed.</p>
          </div>
        </div>

        {loadingImages ? (
          <div className="masonry masonry--top-gap">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="gallery-skeleton">
                <Skeleton.Image active className="gallery-skeleton-image" />
              </div>
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="profile-empty-gallery">
            <Empty
              description={isOwnProfile ? 'You have not published any public images yet.' : `${profileUser?.username} hasn't published any public images.`}
            >
              {isOwnProfile && (
                <Button variant="primary" onClick={() => navigate('/studio')}>
                  Create & Publish Image
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          <div className="masonry masonry--top-gap">
            {images.map(item => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile Info"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        className="glass-modal"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProfile}
          initialValues={{
            username: profileUser?.username,
            gender: profileUser?.gender,
            bio: profileUser?.bio,
          }}
          className="profile-edit-form"
        >
          <Form.Item
            name="username"
            label="Display Name"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input placeholder="Enter username" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Gender"
            rules={[{ required: true, message: 'Please select a gender' }]}
          >
            <Radio.Group>
              <Radio value="MALE">Male</Radio>
              <Radio value="FEMALE">Female</Radio>
              <Radio value="OTHER">Other</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="bio"
            label="Short Bio"
          >
            <Input.TextArea
              placeholder="Tell us about yourself (favorite designs, prompts, styles...)"
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Avatar Image"
          >
            <Upload
              listType="picture"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false}
              accept="image/*"
              maxCount={1}
            >
              <Button variant="secondary" icon={<UploadOutlined />}>Select Image File</Button>
            </Upload>
          </Form.Item>

          <Form.Item className="profile-form-footer">
            <Space>
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button variant="primary" htmlType="submit" loading={updating}>
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProfilePage
