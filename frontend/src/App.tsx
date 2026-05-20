import { Card, Form, App as AntApp } from 'antd'
import { AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import { ImagePreview } from './components/ImagePreview'
import { Button } from 'antd'
import { PictureOutlined } from '@ant-design/icons'
import { PipelineControls } from './components/PipelineControls'
import { ProgressPipeline } from './components/ProgressPipeline'
import { UploadZone } from './components/UploadZone'
import { usePipelineSteps } from './hooks/usePipelineSteps'
import { useAuth } from './context/AuthContext'
import { useImages } from './context/ImagesContext'
import type { ProcessFormValues, ProcessResponse, ApiResponse } from './types'
import axiosInstance from './api/axiosInstance'

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
      <div className="app-content">
        <div className="app-shell">
          <Card variant="borderless" className="upload-hero-card" styles={{ body: { padding: 20 } }}>
            <UploadZone file={file} previewUrl={previewUrl} onChange={handleUploadChange} disabled={!user} />
          </Card>

          <div className="workspace-grid">
            <Card variant="borderless" className="settings-card" styles={{ body: { padding: 20 } }}>
              <div className="settings-header">
                <h2>Pipeline Settings</h2>
                <p>{user ? 'Adjust each stage, then run processing.' : 'Vui lòng đăng nhập để sử dụng tính năng này'}</p>
                {user && (
                  <div style={{ marginTop: 8 }}>
                    <Button type="default" icon={<PictureOutlined />} onClick={() => navigate('/my-images')}>
                      Xem ảnh của tôi
                    </Button>
                  </div>
                )}
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

            <Card variant="borderless" className="preview-card" styles={{ body: { padding: 20 } }}>
              <ImagePreview
                originalUrl={previewUrl}
                processedUrl={processedUrl}
                executionTime={executionTime}
                processedFilename={processedFilename}
              />
            </Card>
          </div>
        </div>
      </div>
    </AntApp>
  )
}
