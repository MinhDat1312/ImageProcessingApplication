import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space } from 'antd'
import { EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import axiosInstance from '../../api/axiosInstance'
import type { ApiResponse, UserAccount, AdminRole } from '../../types'
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
      const res = await axiosInstance.get<ApiResponse<{ users: UserAccount[] }>>('/api/v1/admin/users')
      setAccounts(res.data.data.users)
    } catch {
      message.error('Error fetching accounts list')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    setRolesLoading(true)
    try {
      const res = await axiosInstance.get<ApiResponse<{ roles: AdminRole[] }>>('/api/v1/admin/roles')
      setRoles(res.data.data.roles)
    } catch {
      message.error('Error fetching roles list')
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
      await axiosInstance.delete<ApiResponse<unknown>>(`/api/v1/admin/users/${userId}`)
      message.success('Account deleted successfully')
      fetchAccounts()
    } catch {
      message.error('Error deleting account')
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await axiosInstance.patch<ApiResponse<unknown>>(`/api/v1/admin/users/${userId}/status`, { enabled: !currentStatus })
      message.success(`Account has been ${!currentStatus ? 'enabled' : 'disabled'}`)
      fetchAccounts()
    } catch {
      message.error('Error updating status')
    }
  }

  const handleSubmit = async (values: UpdateFormValues) => {
    try {
      if (editingUser) {
        await axiosInstance.patch<ApiResponse<unknown>>(`/api/v1/admin/users/${editingUser.userId}`, {
          email: values.email,
          roleId: values.role,
        })
        message.success('Account updated successfully')
      }
      setIsModalVisible(false)
      fetchAccounts()
    } catch {
      message.error('Error updating account')
    }
  }

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => {
        const map: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }
        return map[gender] ?? gender
      },
    },
    { title: 'Role', dataIndex: ['role', 'name'], key: 'role' },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <span style={{ color: enabled ? '#10b981' : '#ef4444' }}>
          {enabled ? 'Active' : 'Disabled'}
        </span>
      ),
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
            {record.enabled ? 'Block' : 'Unblock'}
          </Button>
          <Popconfirm
            title="Confirm Delete"
            description="Are you sure you want to delete this account?"
            onConfirm={() => handleDeleteAccount(record.userId)}
            okText="Yes"
            cancelText="No"
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
        <h2>Accounts Management</h2>
      </div>
      <Table columns={columns} dataSource={accounts} loading={loading} rowKey="userId" pagination={{ pageSize: 10 }} />

      <Modal
        title="Update Account"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Username" name="username">
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select a role' }]}
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
