import type { RequestOptions } from '../types/api'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7232/api').replace(/\/$/, '')

export function getApiOrigin() {
  return API_BASE_URL.replace(/\/api$/, '')
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, isFormData } = options

  const headers: Record<string, string> = {}
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : undefined),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = (payload && typeof payload === 'object' && 'message' in payload && String(payload.message)) || 'Request failed'
    throw new ApiError(message, response.status)
  }

  return payload as T
}
