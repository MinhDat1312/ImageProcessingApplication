import { Tabs } from 'antd'
import { UserOutlined, FileImageOutlined, SafetyOutlined, BarChartOutlined } from '@ant-design/icons'
import { AccountsTab } from '../components/admin/AccountsTab'
import { ImagesTab } from '../components/admin/ImagesTab'
import { RolesPermissionsTab } from '../components/admin/RolesPermissionsTab'
import { AccessStatsTab } from '../components/admin/AccessStatsTab'
import './AdminPage.css'

export function AdminPage() {
  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      <Tabs
        items={[
          {
            key: 'accounts',
            label: (
              <>
                <UserOutlined />
                Quản Lý Tài Khoản
              </>
            ),
            children: <AccountsTab />,
          },
          {
            key: 'images',
            label: (
              <>
                <FileImageOutlined />
                Quản Lý Hình Ảnh
              </>
            ),
            children: <ImagesTab />,
          },
          {
            key: 'roles-permissions',
            label: (
              <>
                <SafetyOutlined />
                Vai Trò & Quyền Hạn
              </>
            ),
            children: <RolesPermissionsTab />,
          },
          {
            key: 'stats',
            label: (
              <>
                <BarChartOutlined />
                Thống Kê Truy Cập
              </>
            ),
            children: <AccessStatsTab />,
          },
        ]}
      />
    </div>
  )
}
