export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
}

export type UserDto = {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
  profileImagePath: string
  bio?: string
}

export type LoginResponse = {
  token: string
  expiresAt: string
  user: UserDto
}

export type RegisterResponse = LoginResponse
