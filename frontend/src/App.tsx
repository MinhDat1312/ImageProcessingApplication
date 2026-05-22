import {
  App as AntApp,
  Button,
  Card,
  Form,
  Segmented,
  Space,
  Statistic,
  Tag,
  Modal,
  Input,
} from 'antd'
import {
  ArrowRightOutlined,
  CompassOutlined,
  CopyOutlined,
  DownloadOutlined,
  HistoryOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  UngroupOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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

const systemPresets = [
  {
    id: 'system-cinematic',
    title: 'Cinematic enhancement',
    description: 'Sharpen, contrast, watermark, and compress for gallery-ready exports.',
    tag: 'System',
    values: {
      filterType: 'contrast',
      contrastLevel: 1.4,
      watermarkText: 'NovaCanvas AI',
      watermarkPosition: 'bottom-right',
      watermarkSize: 24,
      compressionQuality: 0.85,
    }
  },
  {
    id: 'system-social',
    title: 'Batch social resize',
    description: 'Resize and crop for square social posts, stories, and thumbnails.',
    tag: 'System',
    values: {
      resizeWidth: 1080,
      resizeHeight: 1080,
      cropX: 0,
      cropY: 0,
      cropWidth: 800,
      cropHeight: 800,
      filterType: 'none',
      compressionQuality: 0.9,
    }
  },
  {
    id: 'system-archival',
    title: 'Clean archival',
    description: 'Grayscale, mild sharpen, and lossless preservation for document workflows.',
    tag: 'System',
    values: {
      filterType: 'grayscale',
      compressionQuality: 1.0,
    }
  }
]

const recentHistory = [
  { label: 'Prompt remix', meta: '2 min ago', status: 'Queued' },
  { label: 'Portrait cleanup', meta: '11 min ago', status: 'Completed' },
  { label: 'Batch watermark', meta: '34 min ago', status: 'Synced' },
  { label: 'Color grade preset', meta: '1 h ago', status: 'Saved' },
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
  const location = useLocation()

  const [form] = Form.useForm<ProcessFormValues>()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [processedFilename, setProcessedFilename] = useState<string>()
  const [processing, setProcessing] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [visibility, setVisibility] = useState<'public' | 'private'>('private')
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [customPresets, setCustomPresets] = useState<any[]>([])
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [savePresetName, setSavePresetName] = useState('')

  const fetchPresets = async () => {
    if (!user) {
      setCustomPresets([])
      return
    }
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>('/api/v1/presets')
      setCustomPresets(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch presets', error)
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [user])

  const handleSavePreset = async () => {
    if (!savePresetName.trim()) {
      notification.warning({ message: 'Preset name is required' })
      return
    }
    
    const formValues = form.getFieldsValue()
    
    try {
      await axiosInstance.post('/api/v1/presets', {
        name: savePresetName,
        stepsJson: JSON.stringify(formValues),
      })
      notification.success({
        message: 'Preset Saved',
        description: `Pipeline configuration "${savePresetName}" saved successfully.`,
      })
      setIsSaveModalOpen(false)
      setSavePresetName('')
      fetchPresets()
    } catch (error) {
      console.error('Failed to save preset', error)
      notification.error({
        message: 'Save Failed',
        description: 'Could not save the pipeline preset.',
      })
    }
  }

  const handleDeletePreset = async (presetId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/presets/${presetId}`)
      notification.success({
        message: 'Preset Deleted',
        description: 'Your custom preset has been successfully removed.',
      })
      fetchPresets()
    } catch (err) {
      console.error(err)
      notification.error({
        message: 'Delete Failed',
        description: 'Could not delete the custom preset.',
      })
    }
  }

  // Listen to forwarded image URLs (e.g. from the generator page)
  useEffect(() => {
    const incomingUrl = location.state?.imageUrl
    if (incomingUrl) {
      notification.info({
        message: 'Image Forwarded',
        description: 'Loading image into Studio workspace...',
      })

      fetch(incomingUrl)
        .then(res => res.blob())
        .then(blob => {
          const filename = incomingUrl.split('/').pop() || `forwarded-${Date.now()}.png`
          const forwardedFile = new File([blob], filename, { type: blob.type || 'image/png' })
          setFile(forwardedFile)
          setPreviewUrl(incomingUrl)
          setProcessedUrl(null)
          setProcessedFilename(undefined)
          setExecutionTime(null)
        })
        .catch(err => {
          notification.error({
            message: 'Load Failed',
            description: 'Could not load forwarded image.',
          })
          console.error(err)
        })
    }
  }, [location.state])

  const handleApplyPreset = (preset: any) => {
    let presetTitle = '';
    if (preset.values) {
      // System preset
      presetTitle = preset.title;
      form.setFieldsValue({
        filterType: 'none',
        brightnessLevel: 1.0,
        contrastLevel: 1.0,
        rotateAngle: 0,
        watermarkText: '',
        watermarkPosition: 'bottom-right',
        watermarkSize: 18,
        compressionQuality: 0.9,
        resizeWidth: undefined,
        resizeHeight: undefined,
        cropX: undefined,
        cropY: undefined,
        cropWidth: undefined,
        cropHeight: undefined,
        ...preset.values
      });
    } else {
      // Custom user preset
      presetTitle = preset.name;
      try {
        const values = JSON.parse(preset.stepsJson);
        form.setFieldsValue({
          filterType: 'none',
          brightnessLevel: 1.0,
          contrastLevel: 1.0,
          rotateAngle: 0,
          watermarkText: '',
          watermarkPosition: 'bottom-right',
          watermarkSize: 18,
          compressionQuality: 0.9,
          resizeWidth: undefined,
          resizeHeight: undefined,
          cropX: undefined,
          cropY: undefined,
          cropWidth: undefined,
          cropHeight: undefined,
          ...values
        });
      } catch (err) {
        console.error(err);
        notification.error({
          message: 'Error Loading Preset',
          description: 'The saved configuration could not be parsed.',
        });
        return;
      }
    }
    notification.success({
      message: 'Preset Applied',
      description: `Settings for "${presetTitle}" loaded. Click "Run pipeline" to apply.`,
    });
  }

  const handleDuplicatePreset = (preset: any) => {
    const title = preset.title || preset.name;
    const configString = preset.values 
      ? JSON.stringify(preset.values, null, 2) 
      : JSON.stringify(JSON.parse(preset.stepsJson), null, 2);
    
    navigator.clipboard.writeText(configString).then(() => {
      notification.info({
        message: 'Preset Copied',
        description: `Configuration JSON for "${title}" copied to clipboard.`,
      });
    }).catch(err => {
      console.error('Failed to copy', err);
      notification.warning({
        message: 'Copy Failed',
        description: `Preset details for "${title}" could not be written to clipboard automatically.`,
      });
    });
  }

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
      if (values.brightnessLevel !== undefined) formData.append('brightnessLevel', String(values.brightnessLevel))
      if (values.contrastLevel !== undefined) formData.append('contrastLevel', String(values.contrastLevel))
    }
    if (values.cropX !== undefined && values.cropX !== null) formData.append('cropX', String(values.cropX))
    if (values.cropY !== undefined && values.cropY !== null) formData.append('cropY', String(values.cropY))
    if (values.cropWidth !== undefined && values.cropWidth !== null) formData.append('cropWidth', String(values.cropWidth))
    if (values.cropHeight !== undefined && values.cropHeight !== null) formData.append('cropHeight', String(values.cropHeight))
    if (values.rotateAngle !== undefined && values.rotateAngle !== null && values.rotateAngle !== 0) {
      formData.append('rotateAngle', String(values.rotateAngle))
    }
    if (values.watermarkText) {
      formData.append('watermarkText', values.watermarkText)
      formData.append('watermarkPosition', values.watermarkPosition || 'bottom-right')
      formData.append('watermarkSize', String(values.watermarkSize))
    }
    formData.append('compressionQuality', String(values.compressionQuality))
    formData.append('visibility', visibility.toUpperCase())
    if (values.title) formData.append('title', values.title)
    if (values.description) formData.append('description', values.description)
    if (values.tags) formData.append('tags', values.tags)
    if (values.prompt) formData.append('prompt', values.prompt)

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
            <Card className="glass-card studio-card" bordered={false}>
              <div className="section-header compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="section-kicker">04. Presets</span>
                  <h2>Saved pipelines and generation history</h2>
                  <p>Reuse preset chains, revisit recent runs, and keep the studio organized.</p>
                </div>
                {user && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => setIsSaveModalOpen(true)}
                  >
                    Save Preset
                  </Button>
                )}
              </div>

              <div className="preset-stack">
                {[
                  ...systemPresets,
                  ...customPresets.map(cp => ({
                    id: cp.id,
                    title: cp.name,
                    description: `Custom preset created on ${new Date(cp.createdAt).toLocaleDateString()}`,
                    tag: 'Custom',
                    stepsJson: cp.stepsJson
                  }))
                ].map(preset => (
                  <article key={preset.id || preset.title} className="preset-card">
                    <div className="preset-card-top">
                      <strong>{preset.title}</strong>
                      <Tag color={preset.tag === 'System' ? 'geekblue' : 'purple'}>{preset.tag}</Tag>
                    </div>
                    <p>{preset.description}</p>
                    <div className="preset-actions">
                      <Button 
                        size="small" 
                        icon={<PlayCircleOutlined />} 
                        onClick={() => handleApplyPreset(preset)}
                      >
                        Run preset
                      </Button>
                      <Button 
                        size="small" 
                        icon={<CopyOutlined />}
                        onClick={() => handleDuplicatePreset(preset)}
                      >
                        Duplicate
                      </Button>
                      {preset.tag === 'Custom' && (
                        <Button 
                          size="small" 
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeletePreset(preset.id)}
                        >
                          Delete
                        </Button>
                      )}
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
                  <span>{showProgress ? 'Live stage updates are visible above.' : 'Waiting for the next upload.'}</span>
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
      <Modal
        title="Save Current Pipeline Configuration"
        open={isSaveModalOpen}
        onOk={handleSavePreset}
        onCancel={() => {
          setIsSaveModalOpen(false)
          setSavePresetName('')
        }}
        okText="Save Preset"
        cancelText="Cancel"
        destroyOnClose
      >
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--foreground-muted)' }}>
            Preset Name
          </label>
          <Input
            placeholder="e.g. Vintage Matte, Editorial Glow"
            value={savePresetName}
            onChange={e => setSavePresetName(e.target.value)}
            onPressEnter={handleSavePreset}
            autoFocus
          />
        </div>
      </Modal>
    </AntApp>
  )
}
