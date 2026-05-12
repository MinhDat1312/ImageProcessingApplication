import { useState, useEffect } from 'react'
import { Card, Row, Col, Tabs, message, Statistic, DatePicker, Button, Space, Empty } from 'antd'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CalendarOutlined } from '@ant-design/icons'
import axiosInstance from '../../api/axiosInstance'
import type { AccessLog } from '../../types'
import './admin.css'

export function AccessStatsTab() {
  const [hourlyStats, setHourlyStats] = useState<AccessLog[]>([])
  const [dailyStats, setDailyStats] = useState<AccessLog[]>([])
  const [monthlyStats, setMonthlyStats] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [totalAccess, setTotalAccess] = useState(0)
  const [todayAccess, setTodayAccess] = useState(0)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async (date?: string, month?: string, year?: number) => {
    setLoading(true)
    try {
      const params: any = {}
      if (date) params.date = date
      if (month) params.month = month
      if (year) params.year = year

      const res = await axiosInstance.get('/api/v1/admin/access-stats', { params })
      
      setHourlyStats(res.data.hourly || [])
      setDailyStats(res.data.daily || [])
      setMonthlyStats(res.data.monthly || [])
      setTotalAccess(res.data.totalAccess || 0)
      setTodayAccess(res.data.todayAccess || 0)
    } catch (error) {
      message.error('Lỗi khi tải thống kê')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchByDate = () => {
    if (selectedDate) {
      const dateStr = selectedDate.format('YYYY-MM-DD')
      fetchStats(dateStr)
    }
  }

  const handleFetchByMonth = () => {
    if (selectedMonth) {
      const monthStr = selectedMonth.format('YYYY-MM')
      fetchStats(undefined, monthStr)
    }
  }

  const handleFetchByYear = () => {
    fetchStats(undefined, undefined, selectedYear)
  }

  const formatChartData = (data: AccessLog[]) => {
    return data.map(item => ({
      name: item.timestamp,
      count: item.count,
      timestamp: item.timestamp,
    }))
  }

  return (
    <div className="admin-tab">
      <div className="tab-header">
        <h2>Thống Kê Truy Cập</h2>
      </div>

      <Row gutter={16} className="stats-summary">
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Tổng Lượt Truy Cập"
              value={totalAccess}
              suffix="lượt"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Lượt Truy Cập Hôm Nay"
              value={todayAccess}
              suffix="lượt"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'hourly',
            label: 'Thống Kê Theo Giờ',
            children: (
              <div className="stats-content">
                <Space className="filter-section">
                  <DatePicker
                    placeholder="Chọn ngày"
                    value={selectedDate}
                    onChange={setSelectedDate}
                  />
                  <Button type="primary" icon={<CalendarOutlined />} onClick={handleFetchByDate}>
                    Xem
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
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#1890ff"
                        name="Lượt Truy Cập"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="Không có dữ liệu" style={{ marginTop: '50px' }} />
                )}
              </div>
            ),
          },
          {
            key: 'daily',
            label: 'Thống Kê Theo Tháng',
            children: (
              <div className="stats-content">
                <Space className="filter-section">
                  <DatePicker
                    picker="month"
                    placeholder="Chọn tháng"
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                  />
                  <Button type="primary" icon={<CalendarOutlined />} onClick={handleFetchByMonth}>
                    Xem
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
                      <Bar dataKey="count" fill="#1890ff" name="Lượt Truy Cập" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="Không có dữ liệu" style={{ marginTop: '50px' }} />
                )}
              </div>
            ),
          },
          {
            key: 'yearly',
            label: 'Thống Kê Theo Năm',
            children: (
              <div className="stats-content">
                <Space className="filter-section">
                  <DatePicker
                    picker="year"
                    placeholder="Chọn năm"
                    value={undefined}
                    onChange={(date) => {
                      if (date) setSelectedYear(date.year())
                    }}
                  />
                  <Button type="primary" icon={<CalendarOutlined />} onClick={handleFetchByYear}>
                    Xem
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
                      <Bar dataKey="count" fill="#52c41a" name="Lượt Truy Cập" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="Không có dữ liệu" style={{ marginTop: '50px' }} />
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
