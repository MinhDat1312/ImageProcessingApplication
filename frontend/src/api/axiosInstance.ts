import axios from 'axios'
import type { ApiResponse } from '../types'
import { AUTH_LOGOUT_EVENT } from '../types'

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

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (!error.config) {
      return Promise.reject(error)
    }

    const original = error.config as typeof error.config & { _retry?: boolean }

    if (original.url === '/api/v1/auth/refresh') {
      return Promise.reject(error)
    }

    if (error.response?.status !== 401 || original._retry) {
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
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosInstance
