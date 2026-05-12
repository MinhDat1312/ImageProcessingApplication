import { useState, useEffect } from 'react'
import { Table, Button, Modal, Popconfirm, message, Space, Image, Tooltip } from 'antd'
import { DeleteOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import axiosInstance from '../../api/axiosInstance'
import type { AdminImage } from '../../types'
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
      const res = await axiosInstance.get<{ images: AdminImage[] }>('/api/v1/admin/images')
      setImages(res.data.images)
    } catch (error) {
      message.error('Lỗi khi tải danh sách hình ảnh')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/images/${imageId}`)
      message.success('Xóa hình ảnh thành công')
      fetchImages()
    } catch (error) {
      message.error('Lỗi khi xóa hình ảnh')
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
      title: 'Tên File',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: 'Chủ Sở Hữu',
      dataIndex: ['owner', 'username'],
      key: 'owner',
    },
    {
      title: 'Email Chủ Sở Hữu',
      dataIndex: ['owner', 'email'],
      key: 'ownerEmail',
    },
    {
      title: 'Kích Thước',
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
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_: any, record: AdminImage) => (
        <Space>
          <Tooltip title="Xem">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setPreviewImage(record.url)}
            />
          </Tooltip>
          <Tooltip title="Tải Xuống">
            <Button
              type="default"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record.url, record.filename)}
            />
          </Tooltip>
          <Popconfirm
            title="Xác Nhận Xóa"
            description="Bạn có chắc chắn muốn xóa hình ảnh này?"
            onConfirm={() => handleDeleteImage(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="admin-tab">
      <div className="tab-header">
        <h2>Quản Lý Hình Ảnh</h2>
      </div>
      <Table
        columns={columns}
        dataSource={images}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Xem Hình Ảnh"
        open={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
      >
        {previewImage && <Image src={previewImage} style={{ width: '100%' }} />}
      </Modal>
    </div>
  )
}
