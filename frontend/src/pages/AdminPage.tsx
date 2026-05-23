import { Statistic, Tabs, Tag } from 'antd'
import { Card } from '../components/ui/Card'
import { UserOutlined, FileImageOutlined, SafetyOutlined, BarChartOutlined, ThunderboltOutlined, DatabaseOutlined, TeamOutlined } from '@ant-design/icons'
import { AccountsTab } from '../components/admin/AccountsTab'
import { ImagesTab } from '../components/admin/ImagesTab'
import { RolesPermissionsTab } from '../components/admin/RolesPermissionsTab'
import { AccessStatsTab } from '../components/admin/AccessStatsTab'
import './AdminPage.css'

const adminStats = [
  { title: 'Active users', value: '1.2k', icon: <TeamOutlined /> },
  { title: 'Stored assets', value: '48k', icon: <DatabaseOutlined /> },
  { title: 'Realtime events', value: 'Live', icon: <ThunderboltOutlined /> },
]

export function AdminPage() {
  return (
    <div className="admin-page">
      <section className="admin-hero glass-card">
        <div>
          <Tag color="purple">Platform control</Tag>
          <h1>Admin Command Center</h1>
          <p>Monitor accounts, assets, roles, permissions, and traffic from a premium operations console.</p>
        </div>
        <div className="admin-stats-grid">
          {adminStats.map(stat => (
            <Card key={stat.title} className="glass-card admin-stat-card" bordered={false}>
              <Statistic title={stat.title} value={stat.value} prefix={stat.icon} />
            </Card>
          ))}
        </div>
      </section>

      <Card className="glass-card admin-tabs-shell" bordered={false}>
        <Tabs
          items={[
            {
              key: 'accounts',
              label: (
                <>
                  <UserOutlined />
                  Accounts Management
                </>
              ),
              children: <AccountsTab />,
            },
            {
              key: 'images',
              label: (
                <>
                  <FileImageOutlined />
                  Images Management
                </>
              ),
              children: <ImagesTab />,
            },
            {
              key: 'roles-permissions',
              label: (
                <>
                  <SafetyOutlined />
                  Roles & Permissions
                </>
              ),
              children: <RolesPermissionsTab />,
            },
            {
              key: 'stats',
              label: (
                <>
                  <BarChartOutlined />
                  Access Statistics
                </>
              ),
              children: <AccessStatsTab />,
            },
          ]}
        />
      </Card>
    </div>
  )
}
