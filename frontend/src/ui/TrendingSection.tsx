import { Tag, Spin } from 'antd'
import Card from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import type { ApiResponse, TagImage } from '../types'

export default function TrendingSection() {
  const navigate = useNavigate()
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = (query: string) => {
    navigate(`/explore?q=${encodeURIComponent(query)}`)
  }

    useEffect(() => {
    let mounted = true
    const fetchTags = async () => {
      setLoading(true)
      setError(null)
      try {
        // fetch aggregated tags from dedicated endpoint
        const resp = await axiosInstance.get<ApiResponse<TagImage>>('/api/v1/images/tags', { params: { visibility: 'PUBLIC', limit: 18 } })
        const items = resp.data?.data?.items ?? []
        const tagList = items.map((item) => item.tag)
        if (mounted) setTags(tagList)
      } catch (e: any) {
        console.error('Failed to load popular tags', e)
        if (mounted) setError(e?.response?.data?.error || e.message || 'Failed to load tags')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchTags()
    return () => { mounted = false }
  }, [])

  return (
    <aside>
      <Card className="glass-card" bordered={false} header={<><span className="section-kicker">Trending</span><h3>Popular tags</h3></>} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap', marginTop: 'var(--spacing-3)' }}>
          {loading ? <Spin /> : error ? <div style={{ color: 'var(--text-secondary)' }}>{error}</div> : (
            tags.map(tag => (
              <Tag 
                key={tag} 
                color="purple" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSearch(tag)}
              >
                {tag}
              </Tag>
            ))
          )}
        </div>
      </Card>
 
      <Card className="glass-card" bordered={false} header={<><span className="section-kicker">Explore</span><h3>Prompt showcase</h3></>} footer={<Button variant="ghost" onClick={() => navigate('/explore')}>See more</Button>}>
        <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
          <div 
            className="prompt-sample" 
            onClick={() => handleSearch("Cinematic portrait, volumetric lighting, film grain, 35mm")}
          >
            "Cinematic portrait, volumetric lighting, film grain, 35mm"
          </div>
          <div 
            className="prompt-sample" 
            onClick={() => handleSearch("Landscape, neon skyline, fog, ultra-detailed")}
          >
            "Landscape, neon skyline, fog, ultra-detailed"
          </div>
          <div 
            className="prompt-sample" 
            onClick={() => handleSearch("Macro shot of insect, photoreal, shallow depth")}
          >
            "Macro shot of insect, photoreal, shallow depth"
          </div>
        </div>
      </Card>
    </aside>
  )
}
