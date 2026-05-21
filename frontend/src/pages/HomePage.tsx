import { Button, Card, Statistic, Tag } from 'antd'
import { useEffect } from 'react'
import { CompassOutlined, FireOutlined, PlusOutlined, RocketOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import HomeFeed from '../ui/HomeFeed'
import TrendingSection from '../ui/TrendingSection'

const communityStats = [
  { title: 'Public images', value: '48k', icon: <FireOutlined /> },
  { title: 'Trending prompts', value: '320+', icon: <ThunderboltOutlined /> },
  { title: 'Remixes today', value: '1.2k', icon: <RocketOutlined /> },
]

export default function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'NovaCanvas — Explore'
  }, [])

  return (
    <div className="home-shell">
      <motion.section
        className="home-hero glass-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
      >
        <div className="home-hero-copy">
          <Tag color="cyan">Community feed</Tag>
          <h1>Discover public AI images, prompts, and remix-ready inspiration.</h1>
          <p>
            A social feed for the image pipeline platform with infinite scroll, masonry layout, trend discovery,
            and fast preview cards.
          </p>

          <div className="home-hero-actions">
            <Button type="primary" icon={<CompassOutlined />} onClick={() => navigate('/explore')}>
              Explore gallery
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => navigate('/studio')}>
              Create new image
            </Button>
          </div>
        </div>

        <div className="home-hero-stats">
          {communityStats.map(stat => (
            <Card key={stat.title} className="glass-card metric-card" bordered={false}>
              <Statistic title={stat.title} value={stat.value} prefix={stat.icon} />
            </Card>
          ))}
        </div>
      </motion.section>

      <div className="home-grid">
        <main>
          <section className="feed-section glass-card">
            <div className="section-header compact">
              <div>
                <span className="section-kicker">Feed</span>
                <h2>Public creations from the community</h2>
                <p>Infinite scroll, hover actions, and prompt previews for fast discovery.</p>
              </div>
              <Button icon={<RocketOutlined />} type="primary" onClick={() => navigate('/studio')}>
                Open studio
              </Button>
            </div>
            <HomeFeed />
          </section>
        </main>
        <aside className="home-rail">
          <TrendingSection />

          <Card className="glass-card home-side-card" bordered={false}>
            <span className="section-kicker">Workflow</span>
            <h3>From prompt to publish</h3>
            <p>Generate, process, compare, save, and share without leaving the dashboard.</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
