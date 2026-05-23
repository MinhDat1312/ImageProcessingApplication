import { useState, useEffect } from 'react'
import { Row, Col, Tabs, message, Statistic, DatePicker, Space, Empty } from 'antd'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { Dayjs } from 'dayjs'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { CalendarOutlined } from '@ant-design/icons'
import axiosInstance from '../../api/axiosInstance'
import type { AccessLog, ApiResponse } from '../../types'
import './admin.css'

interface StatsApiResponse {
  hourly: AccessLog[]
  daily: AccessLog[]
  monthly: AccessLog[]
  totalAccess: number
  todayAccess: number
}

interface FetchParams {
  date?: string
  month?: string
  year?: number
}

export function AccessStatsTab() {
  const [hourlyStats, setHourlyStats] = useState<AccessLog[]>([])
  const [dailyStats, setDailyStats] = useState<AccessLog[]>([])
  const [monthlyStats, setMonthlyStats] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null)
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(null)
  const [totalAccess, setTotalAccess] = useState(0)
  const [todayAccess, setTodayAccess] = useState(0)

  useEffect(() => {
    fetchStats({})
  }, [])

  const fetchStats = async (params: FetchParams) => {
    setLoading(true)
    try {
      const res = await axiosInstance.get<ApiResponse<StatsApiResponse>>('/api/v1/admin/access-stats', { params })
      setHourlyStats(res.data.data.hourly ?? [])
      setDailyStats(res.data.data.daily ?? [])
      setMonthlyStats(res.data.data.monthly ?? [])
      setTotalAccess(res.data.data.totalAccess ?? 0)
      setTodayAccess(res.data.data.todayAccess ?? 0)
    } catch {
      message.error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatChartData = (data: AccessLog[]) =>
    data.map(item => ({ name: item.timestamp, count: item.count }))

  return (
    <div className="admin-tab">
      <div className="tab-header">
        <h2>Access Statistics</h2>
      </div>

      <Row gutter={16} className="stats-summary">
        <Col xs={24} sm={12}>
          <Card>
            <Statistic title="Total Accesses" value={totalAccess} suffix="visits" styles={{ content: { color: '#1890ff' } }} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic title="Today's Accesses" value={todayAccess} suffix="visits" styles={{ content: { color: '#52c41a' } }} />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'hourly',
            label: 'Hourly Statistics',
            children: (
              <div className="stats-content">
                <Space className="filter-section">
                  <DatePicker
                    placeholder="Select date"
                    value={selectedDate}
                    onChange={(d: Dayjs | null) => setSelectedDate(d)}
                  />
                  <Button
                    variant="primary"
                    icon={<CalendarOutlined />}
                    loading={loading}
                    disabled={!selectedDate}
                    onClick={() => selectedDate && fetchStats({ date: selectedDate.format('YYYY-MM-DD') })}
                  >
                    View
                  </Button>
                </Space>
                {hourlyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={formatChartData(hourlyStats)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#1890ff" name="Access Count" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data available" style={{ marginTop: '50px' }} />
                )}
              </div>
            ),
          },
          {
            key: 'daily',
            label: 'Monthly Statistics',
            children: (
              <div className="stats-content">
                <Space className="filter-section">
                  <DatePicker
                    picker="month"
                    placeholder="Select month"
                    value={selectedMonth}
                    onChange={(d: Dayjs | null) => setSelectedMonth(d)}
                  />
                  <Button
                    variant="primary"
                    icon={<CalendarOutlined />}
                    loading={loading}
                    disabled={!selectedMonth}
                    onClick={() => selectedMonth && fetchStats({ month: selectedMonth.format('YYYY-MM') })}
                  >
                    View
                  </Button>
                </Space>
                {dailyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={formatChartData(dailyStats)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#1890ff" name="Access Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data available" style={{ marginTop: '50px' }} />
                )}
              </div>
            ),
          },
          {
            key: 'yearly',
            label: 'Yearly Statistics',
            children: (
              <div className="stats-content">
                <Space className="filter-section">
                  <DatePicker
                    picker="year"
                    placeholder="Select year"
                    value={selectedYear}
                    onChange={(d: Dayjs | null) => setSelectedYear(d)}
                  />
                  <Button
                    variant="primary"
                    icon={<CalendarOutlined />}
                    loading={loading}
                    disabled={!selectedYear}
                    onClick={() => selectedYear && fetchStats({ year: selectedYear.year() })}
                  >
                    View
                  </Button>
                </Space>
                {monthlyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={formatChartData(monthlyStats)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#52c41a" name="Access Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data available" style={{ marginTop: '50px' }} />
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
