export interface User {
  id: string
  name: string
  email: string
}

export interface LoginPayload {
  username: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface AuthSession {
  user: User
  accessToken?: string
  localOnly?: boolean
}
