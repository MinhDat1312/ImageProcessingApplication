import axios from 'axios'
import type { ApiResponse } from '../types'
import { AUTH_LOGOUT_EVENT } from '../types'
import { pushAppNotification } from '../context/NotificationsContext'
import { getUserFacingError } from '../utils/errorUtils'
import { rateLimiters } from '../utils/rateLimiter'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  withCredentials: true,
  timeout: 60000, // 60 seconds timeout for image processing
})

// Rate Limiter Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const url = config.url || '';

    let limiter = rateLimiters.api;

    if (url.includes('/upload') || url.includes('/images/upload') || url.includes('/images/process')) {
      limiter = rateLimiters.upload;
    } else if (url.includes('/chat') || url.includes('/assistant')) {
      limiter = rateLimiters.chat;
    } else if (url.includes('/generate') || url.includes('/generation')) {
      limiter = rateLimiters.generation;
    }

    // Check BEFORE recording to see current state
    const status = limiter.canMakeRequest();

    // DEBUG
    console.log(`[RateLimiter] URL: ${url} | Allowed: ${status.allowed} | Remaining: ${status.remaining}`);

    if (!status.allowed) {
      const waitSeconds = Math.ceil(status.resetIn / 1000);
      const actionName = url.includes('/upload') || url.includes('/process') ? 'tải lên'
        : url.includes('/chat') ? 'gửi tin nhắn'
        : url.includes('/generate') ? 'tạo ảnh'
        : 'gửi yêu cầu';

      pushAppNotification({
        kind: 'warning',
        title: 'Rate Limit Reached',
        message: `Quá nhiều yêu cầu ${actionName}. Vui lòng chờ ${waitSeconds}s.`,
        duration: 5,
      });

      return Promise.reject(new axios.Cancel('Rate limit exceeded'));
    }

    // Record AFTER successful check (so limit=1 means 1 request total)
    limiter.recordRequest();
    config.headers['X-RateLimit-Remaining'] = String(Math.max(0, status.remaining - 1));

    return config;
  },
  (error) => Promise.reject(error)
);

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
