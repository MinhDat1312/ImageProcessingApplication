import { useState, useEffect } from 'react'
import { Table, Modal, Form, Select, message, Popconfirm, Space, Tabs } from 'antd'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import axiosInstance from '../../api/axiosInstance'
import type { ApiResponse, AdminRole, Permission } from '../../types'
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
        axiosInstance.get<ApiResponse<{ roles: AdminRole[] }>>('/api/v1/admin/roles'),
        axiosInstance.get<ApiResponse<{ permissions: Permission[] }>>('/api/v1/admin/permissions'),
      ])
      setRoles(rolesRes.data.data.roles)
      setPermissions(permsRes.data.data.permissions)
    } catch {
      message.error('Failed to load data')
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
      await axiosInstance.delete<ApiResponse<unknown>>(`/api/v1/admin/roles/${roleId}`)
      message.success('Role deleted successfully')
      fetchData()
    } catch {
      message.error('Failed to delete role')
    }
  }

  const handleSubmitRole = async (values: RoleFormValues) => {
    try {
      if (editingRole) {
        await axiosInstance.patch<ApiResponse<unknown>>(`/api/v1/admin/roles/${editingRole.roleId}`, values)
        message.success('Role updated successfully')
      } else {
        await axiosInstance.post<ApiResponse<unknown>>('/api/v1/admin/roles', values)
        message.success('Role created successfully')
      }
      setRoleModalVisible(false)
      setEditingRole(null)
      fetchData()
    } catch {
      message.error('Failed to save role')
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
      await axiosInstance.delete<ApiResponse<unknown>>(`/api/v1/admin/permissions/${permissionId}`)
      message.success('Permission deleted successfully')
      fetchData()
    } catch {
      message.error('Failed to delete permission')
    }
  }

  const handleSubmitPermission = async (values: PermissionFormValues) => {
    try {
      if (editingPermission) {
        await axiosInstance.patch<ApiResponse<unknown>>(`/api/v1/admin/permissions/${editingPermission.permissionId}`, values)
        message.success('Permission updated successfully')
      } else {
        await axiosInstance.post<ApiResponse<unknown>>('/api/v1/admin/permissions', values)
        message.success('Permission created successfully')
      }
      setPermissionModalVisible(false)
      setEditingPermission(null)
      fetchData()
    } catch {
      message.error('Failed to save permission')
    }
  }

  const roleColumns = [
    { title: 'Role Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: AdminRole) => (
        <Space>
          <Button variant="primary" size="small" icon={<EditOutlined />} onClick={() => handleEditRole(record)} />
          <Popconfirm
            title="Confirm Delete"
            description="Are you sure you want to delete this role?"
            onConfirm={() => handleDeleteRole(record.roleId)}
            okText="Yes"
            cancelText="No"
          >
            <Button variant="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const permissionColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'API Path', dataIndex: 'apiPath', key: 'apiPath' },
    { title: 'Method', dataIndex: 'method', key: 'method' },
    { title: 'Module', dataIndex: 'module', key: 'module' },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: Permission) => (
        <Space>
          <Button variant="primary" size="small" icon={<EditOutlined />} onClick={() => handleEditPermission(record)} />
          <Popconfirm
            title="Confirm Delete"
            description="Are you sure you want to delete this permission?"
            onConfirm={() => handleDeletePermission(record.permissionId)}
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
      <Tabs
        items={[
          {
            key: 'roles',
            label: 'Roles',
            children: (
              <>
                <div className="tab-header">
                  <h3>Role Management</h3>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setEditingRole(null); roleForm.resetFields(); setRoleModalVisible(true) }}
                  >
                    Create New Role
                  </Button>
                </div>
                <Table columns={roleColumns} dataSource={roles} loading={loading} rowKey="roleId" pagination={{ pageSize: 10 }} />
              </>
            ),
          },
          {
            key: 'permissions',
            label: 'Permissions',
            children: (
              <>
                <div className="tab-header">
                  <h3>Permission Management</h3>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setEditingPermission(null); permissionForm.resetFields(); setPermissionModalVisible(true) }}
                  >
                    Create New Permission
                  </Button>
                </div>
                <Table columns={permissionColumns} dataSource={permissions} loading={loading} rowKey="permissionId" pagination={{ pageSize: 10 }} />
              </>
            ),
          },
        ]}
      />

      <Modal
        title={editingRole ? 'Update Role' : 'Create New Role'}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        onOk={() => roleForm.submit()}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleSubmitRole}>
          <Form.Item label="Role Name" name="name" rules={[{ required: true, message: 'Please enter the role name' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingPermission ? 'Update Permission' : 'Create New Permission'}
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        onOk={() => permissionForm.submit()}
      >
        <Form form={permissionForm} layout="vertical" onFinish={handleSubmitPermission}>
          <Form.Item label="Permission Name" name="name" rules={[{ required: true, message: 'Please enter the permission name' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="API Path" name="apiPath" rules={[{ required: true, message: 'Please enter the API path' }]}>
            <Input placeholder="/api/v1/resource" />
          </Form.Item>
          <Form.Item label="Method" name="method" rules={[{ required: true, message: 'Please select the method' }]}>
            <Select options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => ({ label: m, value: m }))} />
          </Form.Item>
          <Form.Item label="Module" name="module" rules={[{ required: true, message: 'Please enter the module' }]}>
            <Input placeholder="USER / IMAGE / ROLE / PERMISSION" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
