import { App as AntApp, Button, Card, Form, Statistic, Tag } from 'antd'
import { AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import { ImagePreview } from './components/ImagePreview'
import {
  ArrowRightOutlined,
  CloudUploadOutlined,
  GlobalOutlined,
  HistoryOutlined,
  MonitorOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { PipelineControls } from './components/PipelineControls'
import { ProgressPipeline } from './components/ProgressPipeline'
import { UploadZone } from './components/UploadZone'
import { usePipelineSteps } from './hooks/usePipelineSteps'
import { useAuth } from './context/AuthContext'
import { useImages } from './context/ImagesContext'
import type { ProcessFormValues, ProcessResponse, ApiResponse } from './types'
import axiosInstance from './api/axiosInstance'

const heroStats = [
  { label: 'Pipeline uptime', value: '99.9%', prefix: <SafetyOutlined /> },
  { label: 'Realtime preview', value: '< 1s', prefix: <MonitorOutlined /> },
  { label: 'AI assisted', value: 'Gemini', prefix: <ThunderboltOutlined /> },
  { label: 'Storage ready', value: 'S3 / MinIO', prefix: <GlobalOutlined /> },
]

const studioSignals = [
  {
    title: 'Upload studio',
    description: 'Drag, paste, or browse. The drop zone is optimized for large visual assets and instant preview.',
    icon: <CloudUploadOutlined />,
  },
  {
    title: 'Smart workflow',
    description: 'Resize, filter, watermark, and compress in a guided pipeline with animated status feedback.',
    icon: <PlayCircleOutlined />,
  },
  {
    title: 'History & gallery',
    description: 'Processed results are saved into a fast gallery experience with lazy loading and pagination.',
    icon: <HistoryOutlined />,
  },
]

const platformCards = [
  {
    title: 'Generation canvas',
    description: 'A future prompt studio for Gemini-assisted generation, style presets, and seed locking.',
    tag: 'Coming next',
  },
  {
    title: 'Workspace performance',
    description: 'Motion feedback, code splitting, and responsive layouts keep the studio feeling instant.',
    tag: 'Optimized',
  },
  {
    title: 'Community gallery',
    description: 'Featured, saved, and trending assets can become a discovery surface similar to modern AI platforms.',
    tag: 'Scalable',
  },
]

interface ApiError {
  response?: { data?: { error?: string } }
  message?: string
  code?: string
  isAxiosError?: boolean
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
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [previewUrl])

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

  const onFinish = async (values: ProcessFormValues) => {
    if (!file) {
      notification.warning({ title: 'Please select an image before processing' })
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
        title: 'Image processed successfully',
        description: `Pipeline completed in ${data.executionTimeMs} ms - Ảnh đã được lưu vào My Images`,
        duration: 5,
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
        title: 'Processing failed',
        description: errorMessage,
        duration: 5,
      })
    } finally {
      setProcessing(false)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(() => reset(), 2500)
    }
  }

  const showProgress = isRunning || steps.length > 0

  return (
    <AntApp>
      <main className="studio-page">
        <section className="studio-hero">
          <div className="hero-copy">
            <div className="hero-kicker-row">
              <Tag color="magenta">AI Image Processing</Tag>
              <Tag color="cyan">AI Generation Ready</Tag>
              <Tag color="geekblue">WebSocket Realtime</Tag>
            </div>
            <h1>Build a cinematic AI image studio with processing, generation, and gallery workflows.</h1>
            <p>
              A futuristic workspace inspired by Midjourney, Leonardo AI, and Playground AI - designed for fast upload,
              smart editing, instant preview, and scalable media pipelines.
            </p>

            <div className="hero-actions">
              <Button type="primary" size="large" icon={<RocketOutlined />} onClick={() => navigate('/my-images')}>
                Open my gallery
              </Button>
              <Button size="large" icon={<ArrowRightOutlined />} onClick={() => navigate('/register')}>
                Create workspace
              </Button>
            </div>

            <div className="hero-stats-grid">
              {heroStats.map(stat => (
                <Card key={stat.label} className="glass-card stat-card" bordered={false}>
                  <Statistic title={stat.label} value={stat.value} prefix={stat.prefix} />
                </Card>
              ))}
            </div>
          </div>

          <div className="hero-panel">
            <Card className="glass-card hero-panel-card" bordered={false}>
              <div className="hero-panel-topline">
                <span className="live-pill">Live studio</span>
                <span className="hero-panel-note">Gemini + S3 + Redis</span>
              </div>
              <div className="hero-panel-title">Command center for visual AI workflows</div>
              <div className="hero-panel-list">
                {studioSignals.map(signal => (
                  <div key={signal.title} className="hero-panel-item">
                    <div className="hero-panel-icon">{signal.icon}</div>
                    <div>
                      <strong>{signal.title}</strong>
                      <p>{signal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="studio-workspace-grid">
          <div className="studio-workspace-main">
            <Card className="glass-card workspace-card" bordered={false}>
              <div className="section-header">
                <div>
                  <span className="section-kicker">01. Upload Studio</span>
                  <h2>Drop an image and start the processing pipeline</h2>
                  <p>{user ? 'You can remix, preview, and export in a single motion-first workspace.' : 'Sign in to unlock uploads, saved history, and gallery sync.'}</p>
                </div>
                <Button type="default" icon={<PictureOutlined />} onClick={() => navigate('/my-images')}>
                  View gallery
                </Button>
              </div>
              <UploadZone file={file} previewUrl={previewUrl} onChange={handleUploadChange} disabled={!user} />
            </Card>

            <Card className="glass-card workspace-card" bordered={false}>
              <div className="section-header">
                <div>
                  <span className="section-kicker">02. Processing Pipeline</span>
                  <h2>Fine-tune the workflow with guided controls</h2>
                  <p>Resize, filter, watermark, and compress with clear visual feedback and stateful transitions.</p>
                </div>
              </div>

              {user ? (
                <AnimatePresence mode="wait">
                  {showProgress ? (
                    <ProgressPipeline key="progress" steps={steps} />
                  ) : (
                    <PipelineControls key="controls" form={form} onFinish={onFinish} processing={processing} />
                  )}
                </AnimatePresence>
              ) : (
                <AnimatePresence mode="wait">
                  {showProgress ? (
                    <ProgressPipeline key="progress" steps={steps} />
                  ) : (
                    <PipelineControls key="controls" form={form} onFinish={onFinish} processing={processing} disabled />
                  )}
                </AnimatePresence>
              )}
            </Card>
          </div>

          <aside className="studio-workspace-side">
            <Card className="glass-card workspace-card preview-shell" bordered={false}>
              <div className="section-header compact">
                <div>
                  <span className="section-kicker">03. Preview</span>
                  <h2>Before / after comparison</h2>
                </div>
              </div>
              <ImagePreview
                originalUrl={previewUrl}
                processedUrl={processedUrl}
                executionTime={executionTime}
                processedFilename={processedFilename}
              />
            </Card>

            <Card className="glass-card workspace-card side-card" bordered={false}>
              <div className="section-header compact">
                <div>
                  <span className="section-kicker">Platform Signals</span>
                  <h2>Built for scale and realtime collaboration</h2>
                </div>
              </div>
              <div className="signal-list">
                {platformCards.map(card => (
                  <div key={card.title} className="signal-card">
                    <Tag color="blue" className="signal-tag">{card.tag}</Tag>
                    <strong>{card.title}</strong>
                    <p>{card.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </section>
      </main>
    </AntApp>
  )
}
