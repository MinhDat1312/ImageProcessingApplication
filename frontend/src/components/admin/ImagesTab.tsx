import { useState, useEffect } from 'react'
import { Table, Modal, Popconfirm, message, Space, Image, Tooltip } from 'antd'
import { Button } from '../ui/Button'
import { DeleteOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import axiosInstance from '../../api/axiosInstance'
import type { ApiResponse, AdminImage } from '../../types'
import './admin.css'

export function ImagesTab() {
  const [images, setImages] = useState<AdminImage[]>([])
  const [loading, setLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get<ApiResponse<{ images: AdminImage[] }>>('/api/v1/admin/images')
      setImages(res.data.data.images)
    } catch {
      message.error('Error fetching images list')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      await axiosInstance.delete<ApiResponse<unknown>>(`/api/v1/admin/images/${imageId}`)
      message.success('Image deleted successfully')
      fetchImages()
    } catch {
      message.error('Error deleting image')
    }
  }

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.click()
  }

  const columns = [
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: 'Owner',
      dataIndex: ['owner', 'username'],
      key: 'owner',
    },
    {
      title: 'Owner Email',
      dataIndex: ['owner', 'email'],
      key: 'ownerEmail',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size?: number) => {
        if (!size) return 'N/A'
        return size > 1024 * 1024
          ? `${(size / (1024 * 1024)).toFixed(2)} MB`
          : `${(size / 1024).toFixed(2)} KB`
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('en-US'),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_value: unknown, record: AdminImage) => (
        <Space>
          <Tooltip title="View">
            <Button
              variant="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setPreviewImage(record.url)}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button
              variant="secondary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record.url, record.filename)}
            />
          </Tooltip>
          <Popconfirm
            title="Confirm Delete"
            description="Are you sure you want to delete this image?"
            onConfirm={() => handleDeleteImage(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button variant="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="admin-tab">
      <div className="tab-header">
        <h2>Images Management</h2>
      </div>
      <Table
        columns={columns}
        dataSource={images}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="View Image"
        open={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
      >
        {previewImage && <Image src={previewImage} style={{ width: '100%' }} />}
      </Modal>
    </div>
  )
}
