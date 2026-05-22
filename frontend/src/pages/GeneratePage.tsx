import { useState, useEffect } from 'react'
import { Segmented, notification as antNotification } from 'antd'
import { 
  ThunderboltOutlined, BulbOutlined, DownloadOutlined, 
  ShareAltOutlined, RocketOutlined, LoadingOutlined, PictureOutlined 
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useImages } from '../context/useImages'
import axiosInstance from '../api/axiosInstance'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import Spotlight from '../components/ui/Spotlight'
import Image from '../components/ui/Image'

const promptSuggestions = [
  'Cinematic portrait of a cyberpunk explorer, volumetric purple light, detailed matte canvas',
  'Minimal luxury perfume bottle on raw concrete block, warm sunset shadows, magazine grade',
  'Futuristic treehouse in a neon bioluminescent forest, wide angle, photorealistic CGI',
  'Close up editorial shot of a woman with metallic silver face paint, high contrast, studio light',
]

const assistantTools = [
  { title: 'Improve prompt', description: 'Refine composition, style, and lighting details.' },
  { title: 'Suggest prompt', description: 'Get a creative random idea based on modern themes.' },
  { title: 'Generate prompt', description: 'Expand a rough phrase into a detailed AI description.' },
]

export default function GeneratePage() {
  const { user } = useAuth()
  const { triggerRefresh } = useImages()
  const navigate = useNavigate()
  
  const [prompt, setPrompt] = useState('Cinematic portrait of a cyberpunk explorer, volumetric purple light, detailed matte canvas')
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, bad proportions')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [imageTitle, setImageTitle] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null)
  const [aiOutput, setAiOutput] = useState<{ title: string; content: string } | null>(null)

  useEffect(() => {
    document.title = 'Goat Image AI — AI Generator'
  }, [])

  const handleAssistantAction = async (title: string) => {
    if (!prompt.trim() && title !== 'Suggest prompt') {
      antNotification.warning({ message: 'Please enter a prompt or idea first' })
      return
    }

    antNotification.info({
      key: 'ai-assistant',
      message: `${title}...`,
      description: 'Consulting Gemini AI...',
    })

    try {
      let endpoint = ''
      const payload: { input: string; negativePrompt?: string } = { input: prompt }

      switch (title) {
        case 'Generate prompt':
          endpoint = '/api/v1/assistant/prompt/generate'
          break
        case 'Improve prompt':
          endpoint = '/api/v1/assistant/prompt/improve'
          payload.negativePrompt = negativePrompt
          break
        case 'Suggest prompt':
          endpoint = '/api/v1/assistant/prompt/suggest'
          break
        default:
          return
      }

      const response = await axiosInstance.post(endpoint, payload)
      const responseData = response.data
      const content = responseData && responseData.data ? responseData.data.content : (responseData ? responseData.content : '')

      if (title === 'Suggest prompt') {
        setAiOutput({ title, content })
        antNotification.success({
          key: 'ai-assistant',
          message: 'Suggestion Ready',
          description: 'A new idea has been recommended below.',
        })
      } else {
        setPrompt(content)
        antNotification.success({
          key: 'ai-assistant',
          message: `${title} Applied`,
          description: 'Prompt field has been updated.',
        })
      }
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } }; message?: string }).response?.data?.error || (err as Error).message || 'AI request failed'
      antNotification.error({
        key: 'ai-assistant',
        message: 'AI Assistant Error',
        description: errorMsg,
      })
    }
  }

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      antNotification.warning({ message: 'Prompt is required for generation' })
      return
    }

    setGeneratingAI(true)
    setGeneratedImageUrl(null)
    setGeneratedImageId(null)
    
    antNotification.info({
      key: 'ai-gen',
      message: 'Generating image...',
      description: 'Invoking Gemini Imagen 3 model...',
    })

    try {
      const response = await axiosInstance.post('/api/v1/images/generate', {
        prompt,
        negativePrompt,
        aspectRatio,
        title: imageTitle.trim() || undefined,
      })

      const responseData = response.data
      const url = responseData && responseData.data ? responseData.data.url : (responseData ? responseData.url : undefined)
      const id = responseData && responseData.data ? responseData.data.id : (responseData ? responseData.id : undefined)

      setGeneratedImageUrl(url)
      setGeneratedImageId(id)
      
      antNotification.success({
        key: 'ai-gen',
        message: 'Image generated successfully',
        description: 'Your creation is ready.',
      })
      triggerRefresh()
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } }; message?: string }).response?.data?.error || (err as Error).message || 'Generation failed'
      antNotification.error({
        key: 'ai-gen',
        message: 'Generation Failed',
        description: errorMsg,
      })
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImageUrl) return
    try {
      antNotification.info({ message: 'Downloading image...' })
      const res = await fetch(generatedImageUrl)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `goatimageai-gen-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      window.open(generatedImageUrl, '_blank')
    }
  }

  const handlePublishToExplore = () => {
    if (!generatedImageId) return
    antNotification.success({
      message: 'Published successfully',
      description: 'This image is now visible in the community feed.',
    })
    navigate('/explore')
  }

  const handleRemixInStudio = () => {
    if (!generatedImageUrl) return
    navigate('/studio', { state: { imageUrl: generatedImageUrl } })
  }

  return (
    <div className="generator-shell">
      <div className="generator-header">
        <span className="section-kicker">AI Workspace</span>
        <h1>AI Image Generator</h1>
        <p>Harness Gemini Imagen 3 to craft high-fidelity, photorealistic or stylized visual assets in seconds.</p>
      </div>

      <div className="generator-layout">
        {/* Input panel (left) */}
        <div className="generator-input-column">
          <Card className="glass-card generator-card" bordered={false}>
            <div className="card-section-header">
              <h2>1. Prompt Settings</h2>
            </div>
            
            <div className="field-group" style={{ marginBottom: 16 }}>
              <label className="field-label" htmlFor="gen-title">Title (Optional)</label>
              <Input
                id="gen-title"
                value={imageTitle}
                onChange={e => setImageTitle(e.target.value)}
                placeholder="Give your generated image a title..."
                disabled={generatingAI}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="gen-prompt">Prompt</label>
              <Input.TextArea
                id="gen-prompt"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                autoSize={{ minRows: 4, maxRows: 6 }}
                placeholder="Describe the image you want to generate in detail..."
                disabled={generatingAI}
              />
            </div>

            <div className="field-group" style={{ marginTop: 16 }}>
              <label className="field-label" htmlFor="gen-negative-prompt">Negative Prompt</label>
              <Input.TextArea
                id="gen-negative-prompt"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 3 }}
                placeholder="Details, colors, or artifacts to avoid..."
                disabled={generatingAI}
              />
            </div>

            <div className="field-group" style={{ marginTop: 16 }}>
              <label className="field-label">Aspect Ratio</label>
              <Segmented
                value={aspectRatio}
                options={[
                  { label: '1:1 Square', value: '1:1' },
                  { label: '16:9 Landscape', value: '16:9' },
                  { label: '4:3 Classic', value: '4:3' },
                  { label: '9:16 Portrait', value: '9:16' },
                ]}
                onChange={val => setAspectRatio(val as string)}
                disabled={generatingAI}
                block
              />
            </div>

            <div className="generator-actions-row">
              <Spotlight enabled={!generatingAI}>
                <Button
                  variant="primary"
                  icon={generatingAI ? <LoadingOutlined /> : <ThunderboltOutlined />}
                  onClick={handleGenerateImage}
                  loading={generatingAI}
                  disabled={generatingAI || !user}
                  className="btn-generate-main"
                >
                  {user ? 'Generate Image' : 'Sign in to generate'}
                </Button>
              </Spotlight>
            </div>
          </Card>

          {/* Prompt Assist cards */}
          <Card className="glass-card generator-card" bordered={false} style={{ marginTop: 20 }}>
            <div className="card-section-header">
              <h2>2. Gemini AI Assistant</h2>
              <p>Inject premium styling, resolve light compositions, or request random seeds.</p>
            </div>
            
            <div className="assistant-tools-list">
              {assistantTools.map(tool => (
                <button
                  key={tool.title}
                  type="button"
                  className="assistant-tool-card"
                  onClick={() => handleAssistantAction(tool.title)}
                  disabled={generatingAI || !user}
                >
                  <div className="tool-card-title">
                    <BulbOutlined />
                    <span>{tool.title}</span>
                  </div>
                  <p>{tool.description}</p>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {aiOutput && (
                <motion.div
                  className="ai-output-box"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className="ai-output-title">
                    <BulbOutlined style={{ color: '#ff007f' }} />
                    <span>Gemini Suggestion</span>
                  </div>
                  <p className="ai-output-content">{aiOutput.content}</p>
                  <div className="ai-output-actions">
                    <Button 
                      size="small" 
                      type="primary"
                      onClick={() => {
                        setPrompt(aiOutput.content)
                        setAiOutput(null)
                      }}
                    >
                      Use Suggestion
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(aiOutput.content)
                        antNotification.success({ message: 'Copied to clipboard' })
                      }}
                    >
                      Copy
                    </Button>
                    <Button size="small" type="text" onClick={() => setAiOutput(null)}>
                      Dismiss
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Output pane (right) */}
        <div className="generator-output-column">
          <Card className="glass-card generator-card output-card-shell" bordered={false}>
            <div className="card-section-header">
              <h2>3. Generated Asset</h2>
            </div>

            <div className="generator-render-canvas">
              {generatingAI ? (
                <div className="render-loading-state">
                  <div className="pulse-skeleton-ring">
                    <LoadingOutlined style={{ fontSize: 40, color: '#ff007f' }} />
                  </div>
                  <span>Dreaming with Imagen 3...</span>
                  <p>Processing prompt rules & lighting details.</p>
                </div>
              ) : generatedImageUrl ? (
                <motion.div 
                  className="render-success-state"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="generated-asset-wrap">
                    <Image src={generatedImageUrl} alt="Generated asset" placeholder aspectRatio={16/9} />
                  </div>
                </motion.div>
              ) : (
                <div className="render-empty-state">
                  <PictureOutlined style={{ fontSize: 48, opacity: 0.3 }} />
                  <span>Awaiting generation...</span>
                  <p>Describe your creative vision on the left and click Generate.</p>
                </div>
              )}
            </div>

            {generatedImageUrl && (
              <motion.div 
                className="generator-asset-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button 
                  type="primary" 
                  icon={<RocketOutlined />} 
                  onClick={handleRemixInStudio}
                  className="btn-remix-glow"
                >
                  Remix in Studio
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                  Download
                </Button>
                <Button icon={<ShareAltOutlined />} onClick={handlePublishToExplore}>
                  Publish to Explore
                </Button>
              </motion.div>
            )}
          </Card>

          {/* Quick suggestions seeds */}
          <Card className="glass-card generator-card" bordered={false} style={{ marginTop: 20 }}>
            <div className="card-section-header">
              <h2>Prompt Seeds</h2>
              <p>Click to try a pre-configured scene composition.</p>
            </div>
            <div className="seed-chips-container">
              {promptSuggestions.map(seed => (
                <button
                  key={seed}
                  type="button"
                  className="seed-chip"
                  onClick={() => setPrompt(seed)}
                  disabled={generatingAI}
                >
                  {seed}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
