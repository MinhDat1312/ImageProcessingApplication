interface ApiErrorShape {
  response?: {
    data?: {
      error?: string
      message?: string
    } | string
    status?: number
  }
  message?: string
  code?: string
}

export function getUserFacingError(error: unknown, fallback: string) {
  const err = error as ApiErrorShape
  const data = err.response?.data

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (typeof data === 'object' && data?.error) {
    return data.error
  }

  if (typeof data === 'object' && data?.message) {
    return data.message
  }

  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return 'Request timeout. The image may be too large or the server took too long to process it.'
  }

  if (err.response?.status === 401) {
    return 'Your session expired. Please sign in again and retry.'
  }

  if (err.response?.status === 403) {
    return 'You do not have permission to perform this action.'
  }

  if (err.response?.status && err.response.status >= 500) {
    return 'The server encountered an internal error. Please retry in a moment.'
  }

  return err.message || fallback
}
