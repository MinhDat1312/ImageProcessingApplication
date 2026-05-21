import { useEffect } from 'react'
import HomeFeed from '../ui/HomeFeed'
import TrendingSection from '../ui/TrendingSection'
import '../App.css'

export default function HomePage() {
  useEffect(() => {
    document.title = 'NovaCanvas — Explore'
  }, [])

  return (
    <div className="home-shell">
      <section className="home-hero glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <span className="section-kicker">Discover</span>
            <h1 style={{ margin: '6px 0' }}>Community creations — prompt-driven gallery</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Infinite scroll, trending topics, and prompt showcases from creators.</p>
          </div>
        </div>
      </section>

      <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <main>
          <HomeFeed />
        </main>
        <aside>
          <TrendingSection />
        </aside>
      </div>
    </div>
  )
}
