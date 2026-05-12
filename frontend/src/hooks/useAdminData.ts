import { useState, useCallback } from 'react'
import { message } from 'antd'
import axiosInstance from '../api/axiosInstance'
import type { UserAccount, AdminImage, Role, Permission, AccessStats } from '../types'

interface UseAdminDataReturn {
  accounts: UserAccount[]
  images: AdminImage[]
  roles: Role[]
  permissions: Permission[]
  accessStats: AccessStats | null
  loading: boolean
  error: string | null
  fetchAccounts: () => Promise<void>
  fetchImages: () => Promise<void>
  fetchRoles: () => Promise<void>
  fetchPermissions: () => Promise<void>
  fetchAccessStats: (params?: any) => Promise<void>
  deleteAccount: (userId: string) => Promise<boolean>
  deleteImage: (imageId: string) => Promise<boolean>
  deleteRole: (roleId: string) => Promise<boolean>
  deletePermission: (permissionId: string) => Promise<boolean>
  updateAccount: (userId: string, data: any) => Promise<boolean>
  updateRole: (roleId: string, data: any) => Promise<boolean>
  updatePermission: (permissionId: string, data: any) => Promise<boolean>
  toggleAccountStatus: (userId: string, enabled: boolean) => Promise<boolean>
}

export function useAdminData(): UseAdminDataReturn {
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [images, setImages] = useState<AdminImage[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [accessStats, setAccessStats] = useState<AccessStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get<{ users: UserAccount[] }>('/api/v1/admin/users')
      setAccounts(res.data.users)
      setError(null)
    } catch (err) {
      setError('Lỗi khi tải danh sách tài khoản')
      message.error('Lỗi khi tải danh sách tài khoản')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get<{ images: AdminImage[] }>('/api/v1/admin/images')
      setImages(res.data.images)
      setError(null)
    } catch (err) {
      setError('Lỗi khi tải danh sách hình ảnh')
      message.error('Lỗi khi tải danh sách hình ảnh')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get<{ roles: Role[] }>('/api/v1/admin/roles')
      setRoles(res.data.roles)
      setError(null)
    } catch (err) {
      setError('Lỗi khi tải danh sách vai trò')
      message.error('Lỗi khi tải danh sách vai trò')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPermissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get<{ permissions: Permission[] }>('/api/v1/admin/permissions')
      setPermissions(res.data.permissions)
      setError(null)
    } catch (err) {
      setError('Lỗi khi tải danh sách quyền hạn')
      message.error('Lỗi khi tải danh sách quyền hạn')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAccessStats = useCallback(async (params?: any) => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/api/v1/admin/access-stats', { params })
      setAccessStats(res.data)
      setError(null)
    } catch (err) {
      setError('Lỗi khi tải thống kê')
      message.error('Lỗi khi tải thống kê')
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteAccount = useCallback(async (userId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/users/${userId}`)
      message.success('Xóa tài khoản thành công')
      return true
    } catch {
      message.error('Lỗi khi xóa tài khoản')
      return false
    }
  }, [])

  const deleteImage = useCallback(async (imageId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/images/${imageId}`)
      message.success('Xóa hình ảnh thành công')
      return true
    } catch {
      message.error('Lỗi khi xóa hình ảnh')
      return false
    }
  }, [])

  const deleteRole = useCallback(async (roleId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/roles/${roleId}`)
      message.success('Xóa vai trò thành công')
      return true
    } catch {
      message.error('Lỗi khi xóa vai trò')
      return false
    }
  }, [])

  const deletePermission = useCallback(async (permissionId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/permissions/${permissionId}`)
      message.success('Xóa quyền hạn thành công')
      return true
    } catch {
      message.error('Lỗi khi xóa quyền hạn')
      return false
    }
  }, [])

  const updateAccount = useCallback(async (userId: string, data: any) => {
    try {
      await axiosInstance.patch(`/api/v1/admin/users/${userId}`, data)
      message.success('Cập nhật tài khoản thành công')
      return true
    } catch {
      message.error('Lỗi khi cập nhật tài khoản')
      return false
    }
  }, [])

  const updateRole = useCallback(async (roleId: string, data: any) => {
    try {
      await axiosInstance.patch(`/api/v1/admin/roles/${roleId}`, data)
      message.success('Cập nhật vai trò thành công')
      return true
    } catch {
      message.error('Lỗi khi cập nhật vai trò')
      return false
    }
  }, [])

  const updatePermission = useCallback(async (permissionId: string, data: any) => {
    try {
      await axiosInstance.patch(`/api/v1/admin/permissions/${permissionId}`, data)
      message.success('Cập nhật quyền hạn thành công')
      return true
    } catch {
      message.error('Lỗi khi cập nhật quyền hạn')
      return false
    }
  }, [])

  const toggleAccountStatus = useCallback(async (userId: string, enabled: boolean) => {
    try {
      await axiosInstance.patch(`/api/v1/admin/users/${userId}/status`, {
        enabled: !enabled,
      })
      message.success(`Tài khoản đã ${!enabled ? 'kích hoạt' : 'vô hiệu hóa'}`)
      return true
    } catch {
      message.error('Lỗi khi cập nhật trạng thái')
      return false
    }
  }, [])

  return {
    accounts,
    images,
    roles,
    permissions,
    accessStats,
    loading,
    error,
    fetchAccounts,
    fetchImages,
    fetchRoles,
    fetchPermissions,
    fetchAccessStats,
    deleteAccount,
    deleteImage,
    deleteRole,
    deletePermission,
    updateAccount,
    updateRole,
    updatePermission,
    toggleAccountStatus,
  }
}
