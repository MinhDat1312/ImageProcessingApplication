import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tabs } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import axiosInstance from '../../api/axiosInstance'
import type { AdminRole, Permission } from '../../types'
import './admin.css'

type RoleFormValues = { name: string; description?: string }
type PermissionFormValues = { name: string; apiPath: string; method: string; module: string }

export function RolesPermissionsTab() {
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [roleForm] = Form.useForm<RoleFormValues>()
  const [permissionForm] = Form.useForm<PermissionFormValues>()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        axiosInstance.get<{ roles: AdminRole[] }>('/api/v1/admin/roles'),
        axiosInstance.get<{ permissions: Permission[] }>('/api/v1/admin/permissions'),
      ])
      setRoles(rolesRes.data.roles)
      setPermissions(permsRes.data.permissions)
    } catch {
      message.error('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleEditRole = (role: AdminRole) => {
    setEditingRole(role)
    roleForm.setFieldsValue({ name: role.name, description: role.description })
    setRoleModalVisible(true)
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/roles/${roleId}`)
      message.success('Xóa vai trò thành công')
      fetchData()
    } catch {
      message.error('Lỗi khi xóa vai trò')
    }
  }

  const handleSubmitRole = async (values: RoleFormValues) => {
    try {
      if (editingRole) {
        await axiosInstance.patch(`/api/v1/admin/roles/${editingRole.roleId}`, values)
        message.success('Cập nhật vai trò thành công')
      } else {
        await axiosInstance.post('/api/v1/admin/roles', values)
        message.success('Tạo vai trò thành công')
      }
      setRoleModalVisible(false)
      setEditingRole(null)
      fetchData()
    } catch {
      message.error('Lỗi khi lưu vai trò')
    }
  }

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission)
    permissionForm.setFieldsValue({
      name: permission.name,
      apiPath: permission.apiPath,
      method: permission.method,
      module: permission.module,
    })
    setPermissionModalVisible(true)
  }

  const handleDeletePermission = async (permissionId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/permissions/${permissionId}`)
      message.success('Xóa quyền hạn thành công')
      fetchData()
    } catch {
      message.error('Lỗi khi xóa quyền hạn')
    }
  }

  const handleSubmitPermission = async (values: PermissionFormValues) => {
    try {
      if (editingPermission) {
        await axiosInstance.patch(`/api/v1/admin/permissions/${editingPermission.permissionId}`, values)
        message.success('Cập nhật quyền hạn thành công')
      } else {
        await axiosInstance.post('/api/v1/admin/permissions', values)
        message.success('Tạo quyền hạn thành công')
      }
      setPermissionModalVisible(false)
      setEditingPermission(null)
      fetchData()
    } catch {
      message.error('Lỗi khi lưu quyền hạn')
    }
  }

  const roleColumns = [
    { title: 'Tên Vai Trò', dataIndex: 'name', key: 'name' },
    { title: 'Mô Tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_: unknown, record: AdminRole) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEditRole(record)} />
          <Popconfirm
            title="Xác Nhận Xóa"
            description="Bạn có chắc chắn muốn xóa vai trò này?"
            onConfirm={() => handleDeleteRole(record.roleId)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const permissionColumns = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'API Path', dataIndex: 'apiPath', key: 'apiPath' },
    { title: 'Method', dataIndex: 'method', key: 'method' },
    { title: 'Module', dataIndex: 'module', key: 'module' },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_: unknown, record: Permission) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEditPermission(record)} />
          <Popconfirm
            title="Xác Nhận Xóa"
            description="Bạn có chắc chắn muốn xóa quyền hạn này?"
            onConfirm={() => handleDeletePermission(record.permissionId)}
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
      <Tabs
        items={[
          {
            key: 'roles',
            label: 'Vai Trò',
            children: (
              <>
                <div className="tab-header">
                  <h3>Quản Lý Vai Trò</h3>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setEditingRole(null); roleForm.resetFields(); setRoleModalVisible(true) }}
                  >
                    Tạo Vai Trò Mới
                  </Button>
                </div>
                <Table columns={roleColumns} dataSource={roles} loading={loading} rowKey="roleId" pagination={{ pageSize: 10 }} />
              </>
            ),
          },
          {
            key: 'permissions',
            label: 'Quyền Hạn',
            children: (
              <>
                <div className="tab-header">
                  <h3>Quản Lý Quyền Hạn</h3>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setEditingPermission(null); permissionForm.resetFields(); setPermissionModalVisible(true) }}
                  >
                    Tạo Quyền Hạn Mới
                  </Button>
                </div>
                <Table columns={permissionColumns} dataSource={permissions} loading={loading} rowKey="permissionId" pagination={{ pageSize: 10 }} />
              </>
            ),
          },
        ]}
      />

      <Modal
        title={editingRole ? 'Cập Nhật Vai Trò' : 'Tạo Vai Trò Mới'}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        onOk={() => roleForm.submit()}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleSubmitRole}>
          <Form.Item label="Tên Vai Trò" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Mô Tả" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingPermission ? 'Cập Nhật Quyền Hạn' : 'Tạo Quyền Hạn Mới'}
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        onOk={() => permissionForm.submit()}
      >
        <Form form={permissionForm} layout="vertical" onFinish={handleSubmitPermission}>
          <Form.Item label="Tên Quyền Hạn" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên quyền hạn' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="API Path" name="apiPath" rules={[{ required: true, message: 'Vui lòng nhập API path' }]}>
            <Input placeholder="/api/v1/resource" />
          </Form.Item>
          <Form.Item label="Method" name="method" rules={[{ required: true, message: 'Vui lòng chọn method' }]}>
            <Select options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => ({ label: m, value: m }))} />
          </Form.Item>
          <Form.Item label="Module" name="module" rules={[{ required: true, message: 'Vui lòng nhập module' }]}>
            <Input placeholder="USER / IMAGE / ROLE / PERMISSION" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
