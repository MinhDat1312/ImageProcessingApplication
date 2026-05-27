import axios from 'axios'
import type { ApiResponse } from '../types'
import { AUTH_LOGOUT_EVENT } from '../types'
import { pushAppNotification } from '../context/NotificationsContext'
import { getUserFacingError } from '../utils/errorUtils'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  withCredentials: true,
  timeout: 60000, // 60 seconds timeout for image processing
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(null)))
  failedQueue = []
}

function getRequestUrl(errorOrResponse: { config?: { url?: string } }) {
  return errorOrResponse.config?.url ?? ''
}

function isProcessRequest(url: string) {
  return url.includes('/api/v1/images/process')
}

function isGenerateRequest(url: string) {
  return url.includes('/api/v1/images/generate')
}

function unwrapData(data: unknown) {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data?: unknown }).data
  }
  return data
}

function notifyOperationSuccess(response: { config?: { url?: string }; data?: unknown }) {
  const url = getRequestUrl(response)
  const data = unwrapData(response.data) as { filename?: string; executionTimeMs?: number } | undefined

  if (isProcessRequest(url)) {
    pushAppNotification({
      kind: 'success',
      title: 'Image processed successfully',
      message: `${data?.filename || 'Your image'} was processed successfully${data?.executionTimeMs ? ` in ${data.executionTimeMs} ms` : ''}.`,
    })
  }

  if (isGenerateRequest(url)) {
    pushAppNotification({
      kind: 'success',
      title: 'AI image generated',
      message: 'Your AI image has been generated successfully and added to your gallery.',
    })
  }
}

function notifyOperationError(error: unknown) {
  const err = error as { config?: { url?: string } }
  const url = getRequestUrl(err)

  if (isProcessRequest(url)) {
    pushAppNotification({
      kind: 'error',
      title: 'Image processing failed',
      message: getUserFacingError(error, 'Image processing failed. Please check the file and pipeline settings.'),
    })
  }

  if (isGenerateRequest(url)) {
    pushAppNotification({
      kind: 'error',
      title: 'AI image generation failed',
      message: getUserFacingError(error, 'AI image generation failed. Please check your prompt and try again.'),
    })
  }
}

axiosInstance.interceptors.response.use(
  response => {
    notifyOperationSuccess(response)
    return response
  },
  async error => {
    if (!error.config) {
      return Promise.reject(error)
    }

    const original = error.config as typeof error.config & { _retry?: boolean }

    if (original.url === '/api/v1/auth/refresh') {
      return Promise.reject(error)
    }

    if (error.response?.status !== 401 || original._retry) {
      notifyOperationError(error)
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => axiosInstance(original))
    }

    original._retry = true
    isRefreshing = true

    try {
      await axiosInstance.get<ApiResponse<unknown>>('/api/v1/auth/refresh')
      processQueue(null)
      return axiosInstance(original)
    } catch (refreshError) {
      processQueue(refreshError)
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT))
      notifyOperationError(error)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosInstance
