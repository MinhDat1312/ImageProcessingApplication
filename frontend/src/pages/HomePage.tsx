import { Button, Statistic, Tag } from 'antd'
import { useEffect } from 'react'
import { 
  CompassOutlined, 
  FireOutlined, 
  RocketOutlined, 
  ThunderboltOutlined, 
  RightOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import HomeFeed from '../ui/HomeFeed'
import TrendingSection from '../ui/TrendingSection'
import Card from '../components/ui/Card'
import { Button as DnaButton } from '../components/ui/Button'

const communityStats = [
  { title: 'Creations generated', value: '150k+', icon: <ThunderboltOutlined style={{ color: '#ff007f' }} /> },
  { title: 'Remixes today', value: '2.4k', icon: <RocketOutlined style={{ color: '#00f2fe' }} /> },
  { title: 'Active creators', value: '18k', icon: <FireOutlined style={{ color: '#f5576c' }} /> },
]

export default function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'NovaCanvas AI — Home'
  }, [])

  return (
    <div className="home-shell">
      {/* Welcome & Portal Header */}
      <motion.div 
        className="home-welcome-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="section-kicker">Unified AI Dashboard</span>
        <h1>Welcome to NovaCanvas AI</h1>
        <p>A next-generation platform for generative AI art creation and high-performance image processing.</p>
      </motion.div>

      {/* Workspace Portal Grid */}
      <div className="portal-grid">
        {/* Card 1: AI Generator */}
        <motion.div
          className="portal-card generator-portal-card glass-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -5 }}
        >
          <div className="portal-card-glow generator-glow" />
          <div className="portal-card-header">
            <div className="portal-icon-wrap generator-icon-wrap">
              <ThunderboltOutlined />
            </div>
            <div>
              <Tag color="magenta">Imagen 3 Model</Tag>
              <h3>AI Image Generator</h3>
            </div>
          </div>
          <p className="portal-card-desc">
            Transform text prompts into breathtaking artwork, photorealistic scenes, or stylized visual assets.
          </p>
          <ul className="portal-feature-list">
            <li><span>✓</span> Gemini Prompt Helper integrations</li>
            <li><span>✓</span> Standard & cinematic aspect ratios</li>
            <li><span>✓</span> Prompt suggestions & negative prompts</li>
            <li><span>✓</span> One-click Remix in Studio</li>
          </ul>
          <DnaButton
            variant="primary"
            size="large"
            icon={<RightOutlined />}
            onClick={() => navigate('/generate')}
            className="portal-cta-btn generator-btn"
          >
            Launch Generator
          </DnaButton>
        </motion.div>

        {/* Card 2: Studio */}
        <motion.div
          className="portal-card studio-portal-card glass-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -5 }}
        >
          <div className="portal-card-glow studio-glow" />
          <div className="portal-card-header">
            <div className="portal-icon-wrap studio-icon-wrap">
              <RocketOutlined />
            </div>
            <div>
              <Tag color="cyan">Pipeline Orchestration</Tag>
              <h3>Image Processing Studio</h3>
            </div>
          </div>
          <p className="portal-card-desc">
            Upload custom assets and run high-speed transformations through sequential pipeline stages.
          </p>
          <ul className="portal-feature-list">
            <li><span>✓</span> Custom filter presets & color adjustments</li>
            <li><span>✓</span> Crop, rotate, and resize tools</li>
            <li><span>✓</span> Precise watermark & compression layers</li>
            <li><span>✓</span> Real-time before/after side-by-side</li>
          </ul>
          <DnaButton
            variant="primary"
            size="large"
            icon={<RightOutlined />}
            onClick={() => navigate('/studio')}
            className="portal-cta-btn studio-btn"
          >
            Open Studio
          </DnaButton>
        </motion.div>
      </div>

      {/* Stats Bar */}
      <motion.div 
        className="home-hero-stats portal-stats"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {communityStats.map(stat => (
          <Card key={stat.title} className="glass-card metric-card" bordered={false}>
            <Statistic title={stat.title} value={stat.value} prefix={stat.icon} />
          </Card>
        ))}
      </motion.div>

      {/* Community highlights & Feed */}
      <div className="home-grid">
        <main>
          <section className="feed-section glass-card">
            <div className="section-header compact">
              <div>
                <span className="section-kicker">Creations Feed</span>
                <h2>Public showcase</h2>
                <p>Explore community prompts and remix their creations inside the Studio.</p>
              </div>
              <Button icon={<CompassOutlined />} type="default" onClick={() => navigate('/explore')}>
                All creations
              </Button>
            </div>
            <HomeFeed />
          </section>
        </main>
        <aside className="home-rail">
          <TrendingSection />

          <Card className="glass-card home-side-card" bordered={false}>
            <span className="section-kicker">How it works</span>
            <h3>Prompt to Remix</h3>
            <p>Generate a high-fidelity base image in the AI Generator, and click "Remix in Studio" to crop, add filters, or apply watermarks instantly.</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
