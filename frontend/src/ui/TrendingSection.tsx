import { Tag } from 'antd'
import Card from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function TrendingSection() {
  const navigate = useNavigate()
  const trending = ['cinematic portrait', 'neo-tokyo', 'vaporwave', 'photorealistic', 'lowpoly']

  const handleSearch = (query: string) => {
    navigate(`/explore?q=${encodeURIComponent(query)}`)
  }

  return (
    <aside>
      <Card className="glass-card" bordered={false} header={<><span className="section-kicker">Trending</span><h3>Popular prompts</h3></>} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {trending.map(tag => (
            <Tag 
              key={tag} 
              color="purple" 
              style={{ cursor: 'pointer' }}
              onClick={() => handleSearch(tag)}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </Card>

      <Card className="glass-card" bordered={false} header={<><span className="section-kicker">Explore</span><h3>Prompt showcase</h3></>} footer={<Button ghost onClick={() => navigate('/explore')}>See more</Button>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div 
            className="prompt-sample" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleSearch("Cinematic portrait, volumetric lighting, film grain, 35mm")}
          >
            "Cinematic portrait, volumetric lighting, film grain, 35mm"
          </div>
          <div 
            className="prompt-sample" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleSearch("Landscape, neon skyline, fog, ultra-detailed")}
          >
            "Landscape, neon skyline, fog, ultra-detailed"
          </div>
          <div 
            className="prompt-sample" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleSearch("Macro shot of insect, photoreal, shallow depth")}
          >
            "Macro shot of insect, photoreal, shallow depth"
          </div>
        </div>
      </Card>
    </aside>
  )
}
