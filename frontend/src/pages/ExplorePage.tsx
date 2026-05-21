import { Button, Card, Input, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { CompassOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import HomeFeed from '../ui/HomeFeed'
import TrendingSection from '../ui/TrendingSection'

const discoveryTags = ['cinematic portrait', 'neo futuristic', 'product render', 'editorial', 'cinematic lighting']

export function ExplorePage() {
  const [query, setQuery] = useState('')

  useEffect(() => {
    document.title = 'NovaCanvas — Explore'
  }, [])

  return (
    <div className="explore-shell">
      <motion.section
        className="explore-hero glass-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <span className="section-kicker">Discover</span>
          <h1>Explore community images, public prompts, and remix-ready inspiration.</h1>
          <p>
            Search by prompt, tag, or style. The feed is designed as a Pinterest-style discovery surface for AI image
            creators.
          </p>
          <div className="explore-search-row">
            <Input
              size="large"
              prefix={<SearchOutlined />}
              placeholder="Search prompt, tag, creator, style"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
            <Button size="large" type="primary" icon={<CompassOutlined />}>
              Search
            </Button>
          </div>
          <div className="prompt-seed-list prompt-seed-inline">
            {discoveryTags.map(tag => (
              <Tag key={tag} color="cyan" style={{ cursor: 'pointer' }} onClick={() => setQuery(tag)}>
                {tag}
              </Tag>
            ))}
          </div>
        </div>
        <Card className="glass-card explore-side-card" bordered={false}>
          <span className="section-kicker">AI discovery</span>
          <strong>Prompt remix and generation history</strong>
          <p>
            Combine public feed discovery with prompt templates, auto-tagging, and remix workflows powered by Gemini.
          </p>
          <Button icon={<ThunderboltOutlined />}>Open prompt gallery</Button>
        </Card>
      </motion.section>

      <section className="explore-layout">
        <main>
          <HomeFeed />
        </main>
        <aside>
          <TrendingSection />
        </aside>
      </section>
    </div>
  )
}

export default ExplorePage
