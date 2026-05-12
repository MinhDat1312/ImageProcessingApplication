import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space } from 'antd'
import { EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import axiosInstance from '../../api/axiosInstance'
import type { UserAccount } from '../../types'
import './admin.css'

export function AccountsTab() {
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get<{ users: UserAccount[] }>('/api/v1/admin/users')
      setAccounts(res.data.users)
    } catch (error) {
      message.error('Lỗi khi tải danh sách tài khoản')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: UserAccount) => {
    setEditingUser(user)
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role.roleId,
    })
    setIsModalVisible(true)
  }

  const handleDeleteAccount = async (userId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/users/${userId}`)
      message.success('Xóa tài khoản thành công')
      fetchAccounts()
    } catch (error) {
      message.error('Lỗi khi xóa tài khoản')
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await axiosInstance.patch(`/api/v1/admin/users/${userId}/status`, {
        enabled: !currentStatus,
      })
      message.success(`Tài khoản đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'}`)
      fetchAccounts()
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await axiosInstance.patch(`/api/v1/admin/users/${editingUser.userId}`, values)
        message.success('Cập nhật tài khoản thành công')
      }
      setIsModalVisible(false)
      fetchAccounts()
    } catch (error) {
      message.error('Lỗi khi cập nhật tài khoản')
    }
  }

  const columns = [
    {
      title: 'Tên Đăng Nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Giới Tính',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => {
        const genderMap = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }
        return genderMap[gender as keyof typeof genderMap] || gender
      },
    },
    {
      title: 'Vai Trò',
      dataIndex: ['role', 'name'],
      key: 'role',
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <span style={{ color: enabled ? 'green' : 'red' }}>
          {enabled ? 'Đã Kích Hoạt' : 'Vô Hiệu Hóa'}
        </span>
      ),
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
      render: (_: any, record: UserAccount) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="primary"
            size="small"
            danger={!record.enabled}
            icon={record.enabled ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record.userId, record.enabled)}
          >
            {record.enabled ? 'Khóa' : 'Mở'}
          </Button>
          <Popconfirm
            title="Xác Nhận Xóa"
            description="Bạn có chắc chắn muốn xóa tài khoản này?"
            onConfirm={() => handleDeleteAccount(record.userId)}
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
        <h2>Quản Lý Tài Khoản</h2>
      </div>
      <Table
        columns={columns}
        dataSource={accounts}
        loading={loading}
        rowKey="userId"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingUser ? 'Cập Nhật Tài Khoản' : 'Tạo Tài Khoản Mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Tên Đăng Nhập"
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Vai Trò"
            name="role"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              options={[
                { label: 'ADMIN', value: 'admin-role-id' },
                { label: 'USER', value: 'user-role-id' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
