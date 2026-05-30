import * as authApi from '../api/authApi'
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth'

const AUTH_TOKEN_KEY = 'authToken'

export async function registerUser(payload: RegisterRequest): Promise<LoginResponse> {
  const registerResponse = await authApi.register(payload)
  localStorage.setItem(AUTH_TOKEN_KEY, registerResponse.token)
  localStorage.setItem('userId', registerResponse.user.id)
  return registerResponse
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const loginResponse = await authApi.login(payload)
  localStorage.setItem(AUTH_TOKEN_KEY, loginResponse.token)
  localStorage.setItem('userId', loginResponse.user.id)
  return loginResponse
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getUserId(): string | null {
  const userId = localStorage.getItem('userId')
  if (userId) return userId

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return decoded.userId || decoded.sub || null
  } catch (e) {
    console.error('Failed to decode token:', e)
    return null
  }
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem('userId')
}
