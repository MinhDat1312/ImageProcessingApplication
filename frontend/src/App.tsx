import {
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
  Segmented,
  Space,
  Statistic,
  Tag,
} from 'antd'
import {
  ArrowRightOutlined,
  BulbOutlined,
  CompassOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  HistoryOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  UngroupOutlined,
} from '@ant-design/icons'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import axiosInstance from './api/axiosInstance'
import { ImagePreview } from './components/ImagePreview'
import { PipelineControls } from './components/PipelineControls'
import { ProgressPipeline } from './components/ProgressPipeline'
import { UploadZone } from './components/UploadZone'
import { useAuth } from './context/AuthContext'
import { useImages } from './context/useImages'
import { usePipelineSteps } from './hooks/usePipelineSteps'
import type { ApiResponse, ProcessFormValues, ProcessResponse } from './types'

const heroStats = [
  { label: 'Realtime status', value: 'Live', prefix: <SafetyOutlined /> },
  { label: 'Preview latency', value: '< 1s', prefix: <PlayCircleOutlined /> },
  { label: 'AI assistant', value: 'Gemini', prefix: <ThunderboltOutlined /> },
  { label: 'Scale ready', value: 'S3 + Redis', prefix: <CompassOutlined /> },
]

const promptSuggestions = [
  'Cinematic portrait, volumetric light, premium color science, highly detailed',
  'Minimal product shot, dark matte background, chrome reflections',
  'Editorial fashion, neon accents, high contrast, studio grade',
  'Architectural interior, natural light, wide angle, premium render',
]

const pipelinePresetCards = [
  {
    title: 'Cinematic enhancement',
    description: 'Sharpen, contrast, watermark, and compress for gallery-ready exports.',
    tag: 'Popular',
  },
  {
    title: 'Batch social resize',
    description: 'Resize and crop for square social posts, stories, and thumbnails.',
    tag: 'Batch',
  },
  {
    title: 'Clean archival',
    description: 'Grayscale, mild sharpen, and lossless preservation for document workflows.',
    tag: 'Archive',
  },
]

const recentHistory = [
  { label: 'Prompt remix', meta: '2 min ago', status: 'Queued' },
  { label: 'Portrait cleanup', meta: '11 min ago', status: 'Completed' },
  { label: 'Batch watermark', meta: '34 min ago', status: 'Synced' },
  { label: 'Color grade preset', meta: '1 h ago', status: 'Saved' },
]

const assistantTools = [
  { title: 'Generate prompt', description: 'Create a richer prompt from a rough idea.' },
  { title: 'Improve prompt', description: 'Refine style, composition, and lighting.' },
  { title: 'Suggest pipeline', description: 'Recommend the best step order for the result.' },
  { title: 'Explain image', description: 'Break down what is happening in the image.' },
]

const visibilityOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
]

interface ApiError {
  response?: { data?: { error?: string } }
  message?: string
  code?: string
}

export default function App() {
  const { notification } = AntApp.useApp()
  const { user } = useAuth()
  const { triggerRefresh } = useImages()
  const { steps, isRunning, startSimulation, startWaiting, completeAll, failCurrent, reset } = usePipelineSteps()
  const navigate = useNavigate()

  const [form] = Form.useForm<ProcessFormValues>()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [processedFilename, setProcessedFilename] = useState<string>()
  const [processing, setProcessing] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [visibility, setVisibility] = useState<'public' | 'private'>('private')
  const [prompt, setPrompt] = useState('Cinematic portrait, volumetric light, premium color science, highly detailed')
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, extra fingers, distorted face')
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    document.title = 'NovaCanvas AI — Studio'
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [previewUrl])

  const showProgress = isRunning || steps.length > 0

  const handleUploadChange = (nextFile: File | null, nextPreviewUrl: string | null) => {
    setPreviewUrl(prev => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return nextPreviewUrl
    })
    setFile(nextFile)
    setProcessedUrl(null)
    setProcessedFilename(undefined)
    setExecutionTime(null)
    form.resetFields(['resizeWidth', 'resizeHeight', 'watermarkText'])
  }

  const handleAssistantAction = (title: string) => {
    notification.info({
      message: title,
      description: 'Gemini API hook is ready here. Connect the backend service to make this action live.',
    })
  }

  const onFinish = async (values: ProcessFormValues) => {
    if (!file) {
      notification.warning({ message: 'Please select an image before processing' })
      return
    }

    setProcessing(true)
    setProcessedUrl(null)
    startSimulation(values)
    startWaiting()

    const formData = new FormData()
    formData.append('file', file)
    if (values.resizeWidth) formData.append('resizeWidth', String(values.resizeWidth))
    if (values.resizeHeight) formData.append('resizeHeight', String(values.resizeHeight))
    if (values.filterType && values.filterType !== 'none') {
      formData.append('filterType', values.filterType)
      if (values.brightnessLevel) formData.append('brightnessLevel', String(values.brightnessLevel))
    }
    if (values.watermarkText) {
      formData.append('watermarkText', values.watermarkText)
      formData.append('watermarkPosition', values.watermarkPosition || 'bottom-right')
      formData.append('watermarkSize', String(values.watermarkSize))
    }
    formData.append('compressionQuality', String(values.compressionQuality))

    try {
      const response = await axiosInstance.post<ApiResponse<ProcessResponse>>('/api/v1/images/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const data = response.data.data
      completeAll()
      setProcessedUrl(data.url)
      setProcessedFilename(data.filename)
      setExecutionTime(data.executionTimeMs)
      notification.success({
        message: 'Image processed successfully',
        description: `Pipeline completed in ${data.executionTimeMs} ms.`,
      })
      triggerRefresh()
    } catch (err: unknown) {
      failCurrent()
      const error = err as ApiError
      let errorMessage = error.message ?? 'An unexpected error occurred'

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timeout - image processing took too long'
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }

      notification.error({
        message: 'Processing failed',
        description: errorMessage,
      })
    } finally {
      setProcessing(false)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(() => reset(), 2500)
    }
  }

  return (
    <AntApp>
      <main className="studio-shell">
        <section className="studio-hero glass-card">
          <motion.div
            className="studio-hero-copy"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="hero-chip-row">
              <Tag color="magenta">AI Image Platform</Tag>
              <Tag color="cyan">Glassmorphism UI</Tag>
              <Tag color="geekblue">Realtime pipeline</Tag>
            </div>
            <h1>Modern AI image studio for processing, generation, and community publishing.</h1>
            <p>
              Build, remix, and publish images in a dark-mode workspace inspired by Midjourney, Leonardo AI,
              MeiGen Gallery, and Playground AI. The studio keeps upload, prompt design, realtime pipeline status,
              and gallery history in one responsive dashboard.
            </p>

            <Space wrap size={12} className="hero-action-row">
              <Button type="primary" size="large" icon={<RocketOutlined />} onClick={() => navigate('/studio')}>
                Open studio
              </Button>
              <Button size="large" icon={<CompassOutlined />} onClick={() => navigate('/explore')}>
                Explore gallery
              </Button>
              <Button size="large" icon={<MessageOutlined />} onClick={() => navigate('/chat')}>
                AI chat
              </Button>
            </Space>

            <div className="hero-stat-grid">
              {heroStats.map(stat => (
                <Card key={stat.label} className="glass-card metric-card" bordered={false}>
                  <Statistic title={stat.label} value={stat.value} prefix={stat.prefix} />
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="studio-hero-rail glass-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="rail-header">
              <div>
                <span className="section-kicker">Live status</span>
                <h3>Studio command center</h3>
              </div>
              <Tag color="success">Online</Tag>
            </div>

            <div className="rail-stack">
              <div className="status-card status-card-accent">
                <strong>{processing ? 'Processing image' : 'Ready for upload'}</strong>
                <span>{processing ? 'Pipeline is currently running with realtime progress.' : 'Drag an image to start a pipeline or open a prompt preset.'}</span>
              </div>

              <div className="status-card">
                <span className="status-label">Visibility</span>
                <Segmented
                  value={visibility}
                  options={visibilityOptions}
                  onChange={value => setVisibility(value as 'public' | 'private')}
                  block
                />
              </div>

              <div className="status-card">
                <span className="status-label">Preview latency</span>
                <strong>{executionTime !== null ? `${executionTime} ms` : 'Instant local preview'}</strong>
                <span>{processedFilename || 'Processed output will appear here'}</span>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="studio-layout">
          <div className="studio-main-column">
            <Card className="glass-card studio-card" bordered={false}>
              <div className="section-header">
                <div>
                  <span className="section-kicker">01. Upload studio</span>
                  <h2>Upload, preview, and process images in one motion-first flow</h2>
                  <p>
                    Drag & drop, paste screenshots, or browse files. The experience is tuned for fast visual feedback
                    and accessible keyboard control.
                  </p>
                </div>
                {user ? (
                  <Button icon={<PictureOutlined />} onClick={() => navigate('/my-images')}>
                    My gallery
                  </Button>
                ) : (
                  <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigate('/login')}>
                    Sign in
                  </Button>
                )}
              </div>

              <UploadZone file={file} previewUrl={previewUrl} onChange={handleUploadChange} disabled={!user} />
            </Card>

            <div className="studio-split-grid">
              <Card className="glass-card studio-card" bordered={false}>
                <div className="section-header compact">
                  <div>
                    <span className="section-kicker">02. Pipeline</span>
                    <h2>Step-by-step processing chain</h2>
                    <p>Resize, crop, rotate, compress, watermark, filter, and monitor progress with live states.</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {showProgress ? (
                    <motion.div
                      key="progress"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <ProgressPipeline steps={steps} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="controls"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <PipelineControls form={form} onFinish={onFinish} processing={processing} disabled={!user} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              <Card className="glass-card studio-card preview-card-shell" bordered={false}>
                <div className="section-header compact">
                  <div>
                    <span className="section-kicker">03. Preview</span>
                    <h2>Before and after comparison</h2>
                    <p>See the original and processed result side by side before downloading or publishing.</p>
                  </div>
                </div>

                <ImagePreview
                  originalUrl={previewUrl}
                  processedUrl={processedUrl}
                  executionTime={executionTime}
                  processedFilename={processedFilename}
                />
              </Card>
            </div>

            <div className="studio-split-grid">
              <Card className="glass-card studio-card" bordered={false}>
                <div className="section-header compact">
                  <div>
                    <span className="section-kicker">04. Prompt lab</span>
                    <h2>Generate, improve, and remix AI prompts</h2>
                    <p>Design prompts and negative prompts with Gemini-assisted workflows.</p>
                  </div>
                </div>

                <div className="prompt-lab-grid">
                  <div className="prompt-lab-main">
                    <label className="field-label" htmlFor="studio-prompt">Prompt</label>
                    <Input.TextArea
                      id="studio-prompt"
                      value={prompt}
                      onChange={event => setPrompt(event.target.value)}
                      autoSize={{ minRows: 4, maxRows: 7 }}
                      placeholder="Describe the image you want to generate"
                    />

                    <label className="field-label" htmlFor="studio-negative-prompt">Negative prompt</label>
                    <Input.TextArea
                      id="studio-negative-prompt"
                      value={negativePrompt}
                      onChange={event => setNegativePrompt(event.target.value)}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      placeholder="What to avoid in the result"
                    />

                    <div className="prompt-actions">
                      <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => handleAssistantAction('Generate prompt')}>
                        Generate prompt
                      </Button>
                      <Button icon={<EditOutlined />} onClick={() => handleAssistantAction('Improve prompt')}>
                        Improve
                      </Button>
                      <Button icon={<BulbOutlined />} onClick={() => handleAssistantAction('Suggest prompt')}>
                        Suggest
                      </Button>
                      <Button icon={<CopyOutlined />} onClick={() => handleAssistantAction('Copy prompt')}>
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="prompt-lab-side">
                    <div className="assistant-chip-list">
                      {assistantTools.map(tool => (
                        <button key={tool.title} type="button" className="assistant-chip" onClick={() => handleAssistantAction(tool.title)}>
                          <strong>{tool.title}</strong>
                          <span>{tool.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="glass-card studio-card" bordered={false}>
                <div className="section-header compact">
                  <div>
                    <span className="section-kicker">05. Presets</span>
                    <h2>Saved pipelines and generation history</h2>
                    <p>Reuse preset chains, revisit recent runs, and keep the studio organized.</p>
                  </div>
                </div>

                <div className="preset-stack">
                  {pipelinePresetCards.map(preset => (
                    <article key={preset.title} className="preset-card">
                      <div className="preset-card-top">
                        <strong>{preset.title}</strong>
                        <Tag color="geekblue">{preset.tag}</Tag>
                      </div>
                      <p>{preset.description}</p>
                      <div className="preset-actions">
                        <Button size="small" icon={<PlayCircleOutlined />}>
                          Run preset
                        </Button>
                        <Button size="small" icon={<CopyOutlined />}>
                          Duplicate
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="history-list">
                  {recentHistory.map(item => (
                    <div key={item.label} className="history-row">
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.meta}</span>
                      </div>
                      <Tag color="cyan">{item.status}</Tag>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <aside className="studio-rail-column">
            <Card className="glass-card rail-card" bordered={false}>
              <div className="section-header compact">
                <div>
                  <span className="section-kicker">Realtime feed</span>
                  <h3>Processing summary</h3>
                </div>
              </div>
              <div className="rail-stack compact">
                <div className="status-card">
                  <span className="status-label">Pipeline state</span>
                  <strong>{showProgress ? 'Running or staging' : 'Idle'}</strong>
                  <span>{showProgress ? 'Live stage updates are visible above.' : 'Waiting for the next upload or prompt.'}</span>
                </div>
                <div className="status-card">
                  <span className="status-label">Batch processing</span>
                  <strong>Ready</strong>
                  <span>Supports queued processing, realtime progress, and future WebSocket events.</span>
                </div>
              </div>
            </Card>

            <Card className="glass-card rail-card" bordered={false}>
              <div className="section-header compact">
                <div>
                  <span className="section-kicker">Capabilities</span>
                  <h3>Platform highlights</h3>
                </div>
              </div>
              <div className="capability-list">
                <div className="capability-item">
                  <DownloadOutlined />
                  <div>
                    <strong>Download processed assets</strong>
                    <span>Export optimized files with one click.</span>
                  </div>
                </div>
                <div className="capability-item">
                  <HistoryOutlined />
                  <div>
                    <strong>History and presets</strong>
                    <span>Persist reusable steps and prior runs.</span>
                  </div>
                </div>
                <div className="capability-item">
                  <UngroupOutlined />
                  <div>
                    <strong>Compare before / after</strong>
                    <span>Inspect the result side by side before publishing.</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass-card rail-card" bordered={false}>
              <div className="section-header compact">
                <div>
                  <span className="section-kicker">Prompt seeds</span>
                  <h3>Quick remix ideas</h3>
                </div>
              </div>
              <div className="prompt-seed-list">
                {promptSuggestions.map(seed => (
                  <button key={seed} type="button" className="prompt-seed-chip" onClick={() => setPrompt(seed)}>
                    {seed}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="glass-card rail-card" bordered={false}>
              <div className="section-header compact">
                <div>
                  <span className="section-kicker">Social ready</span>
                  <h3>Publishing state</h3>
                </div>
              </div>
              <div className="status-card status-card-accent">
                <strong>{visibility === 'public' ? 'Public image' : 'Private image'}</strong>
                <span>
                  {visibility === 'public'
                    ? 'This result can be surfaced in the community feed and search.'
                    : 'Keep this result private until you are ready to publish it.'}
                </span>
              </div>
            </Card>
          </aside>
        </section>
      </main>
    </AntApp>
  )
}
