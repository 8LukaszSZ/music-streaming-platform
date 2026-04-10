import * as authApi from '../api/authApi'
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth'

const AUTH_TOKEN_KEY = 'authToken'

export async function registerUser(payload: RegisterRequest) {
  return authApi.register(payload)
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const loginResponse = await authApi.login(payload)
  localStorage.setItem(AUTH_TOKEN_KEY, loginResponse.token)
  return loginResponse
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}
