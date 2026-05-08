import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
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
    const original = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => axiosInstance(original))
        .catch(err => Promise.reject(err))
    }

    original._retry = true
    isRefreshing = true

    try {
      await axiosInstance.get('/api/v1/auth/refresh')
      processQueue(null)
      return axiosInstance(original)
    } catch (refreshError) {
      processQueue(refreshError)
      window.dispatchEvent(new CustomEvent('auth:logout'))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosInstance
