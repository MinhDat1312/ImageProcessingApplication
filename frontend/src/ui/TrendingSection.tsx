import { Tag, Card, Button } from 'antd'

export default function TrendingSection() {
  const trending = ['cinematic portrait', 'neo-tokyo', 'vaporwave', 'photorealistic', 'lowpoly']

  return (
    <aside>
      <Card className="glass-card" bordered={false} style={{ marginBottom: 16 }}>
        <div className="section-header compact">
          <div>
            <span className="section-kicker">Trending</span>
            <h3>Popular prompts</h3>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {trending.map(tag => (
            <Tag key={tag} color="purple" style={{ cursor: 'pointer' }}>{tag}</Tag>
          ))}
        </div>
      </Card>

      <Card className="glass-card" bordered={false}>
        <div className="section-header compact">
          <div>
            <span className="section-kicker">Explore</span>
            <h3>Prompt showcase</h3>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="prompt-sample">"Cinematic portrait, volumetric lighting, film grain, 35mm"</div>
          <div className="prompt-sample">"Landscape, neon skyline, fog, ultra-detailed"</div>
          <div className="prompt-sample">"Macro shot of insect, photoreal, shallow depth"</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Button type="text">See more</Button>
        </div>
      </Card>
    </aside>
  )
}
