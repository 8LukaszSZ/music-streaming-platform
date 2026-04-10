import type { LoginRequest, RegisterRequest } from '../types/auth'

export type LoginErrors = Partial<Record<keyof LoginRequest, string>>
export type RegisterErrors = Partial<Record<keyof RegisterRequest | 'confirmPassword', string>>

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,50}$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/

export function validateLogin(payload: LoginRequest): LoginErrors {
  const errors: LoginErrors = {}

  if (!payload.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_REGEX.test(payload.email)) {
    errors.email = 'Please provide a valid email address.'
  }

  if (!payload.password) {
    errors.password = 'Password is required.'
  }

  return errors
}

export function validateRegister(payload: RegisterRequest & { confirmPassword: string }): RegisterErrors {
  const errors: RegisterErrors = {}

  if (!payload.username.trim()) {
    errors.username = 'Username is required.'
  } else if (!USERNAME_REGEX.test(payload.username)) {
    errors.username = 'Username must be 3-50 characters and use only letters, numbers or underscores.'
  }

  if (!payload.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_REGEX.test(payload.email)) {
    errors.email = 'Please provide a valid email address.'
  }

  if (!payload.password) {
    errors.password = 'Password is required.'
  } else if (!PASSWORD_REGEX.test(payload.password)) {
    errors.password =
      'Password must contain at least 8 chars, one uppercase, one lowercase, one number and one special character.'
  }

  if (!payload.confirmPassword) {
    errors.confirmPassword = 'Please repeat your password.'
  } else if (payload.password !== payload.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}
