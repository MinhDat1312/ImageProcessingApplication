import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space } from 'antd'
import { EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import axiosInstance from '../../api/axiosInstance'
import type { UserAccount, AdminRole } from '../../types'
import './admin.css'

type UpdateFormValues = { username: string; email: string; role: string }

export function AccountsTab() {
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [form] = Form.useForm<UpdateFormValues>()

  useEffect(() => {
    fetchAccounts()
    fetchRoles()
  }, [])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get<{ users: UserAccount[] }>('/api/v1/admin/users')
      setAccounts(res.data.users)
    } catch {
      message.error('Lỗi khi tải danh sách tài khoản')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    setRolesLoading(true)
    try {
      const res = await axiosInstance.get<{ roles: AdminRole[] }>('/api/v1/admin/roles')
      setRoles(res.data.roles)
    } catch {
      message.error('Lỗi khi tải danh sách vai trò')
    } finally {
      setRolesLoading(false)
    }
  }

  const handleEdit = (user: UserAccount) => {
    setEditingUser(user)
    form.setFieldsValue({ username: user.username, email: user.email, role: user.role.roleId })
    setIsModalVisible(true)
  }

  const handleDeleteAccount = async (userId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/users/${userId}`)
      message.success('Xóa tài khoản thành công')
      fetchAccounts()
    } catch {
      message.error('Lỗi khi xóa tài khoản')
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await axiosInstance.patch(`/api/v1/admin/users/${userId}/status`, { enabled: !currentStatus })
      message.success(`Tài khoản đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'}`)
      fetchAccounts()
    } catch {
      message.error('Lỗi khi cập nhật trạng thái')
    }
  }

  const handleSubmit = async (values: UpdateFormValues) => {
    try {
      if (editingUser) {
        await axiosInstance.patch(`/api/v1/admin/users/${editingUser.userId}`, {
          email: values.email,
          roleId: values.role,
        })
        message.success('Cập nhật tài khoản thành công')
      }
      setIsModalVisible(false)
      fetchAccounts()
    } catch {
      message.error('Lỗi khi cập nhật tài khoản')
    }
  }

  const columns = [
    { title: 'Tên Đăng Nhập', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Giới Tính',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => {
        const map: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }
        return map[gender] ?? gender
      },
    },
    { title: 'Vai Trò', dataIndex: ['role', 'name'], key: 'role' },
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
      render: (_: unknown, record: UserAccount) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
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
      <Table columns={columns} dataSource={accounts} loading={loading} rowKey="userId" pagination={{ pageSize: 10 }} />

      <Modal
        title="Cập Nhật Tài Khoản"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Tên Đăng Nhập" name="username">
            <Input disabled />
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
              options={roles.map(r => ({ label: r.name, value: r.roleId }))}
              loading={rolesLoading}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
