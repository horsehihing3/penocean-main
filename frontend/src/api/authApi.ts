import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from './types'

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', data)
    return response.data.data
  },

  register: async (data: RegisterRequest): Promise<User> => {
    // Phase 2: backend endpoint to be implemented.
    const response = await axiosInstance.post<ApiResponse<User>>('/auth/register', data)
    return response.data.data
  },

  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post('/auth/logout')
    } catch {
      // ignore — always clear client-side tokens in caller
    }
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/refresh', refreshToken, {
      headers: { 'Content-Type': 'text/plain' },
    })
    return response.data.data
  },
}
