import axiosClient from './axiosClient';
import { getDeviceFingerprint } from '../utils/fingerprint';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserProfileResponse,
} from '../types/auth';

export const authApi = {
  login: async (credentials: Omit<LoginRequest, 'deviceFingerPrint'>): Promise<ApiResponse<LoginResponse>> => {
    const deviceFingerPrint = await getDeviceFingerprint();
    const payload: LoginRequest = {
      ...credentials,
      deviceFingerPrint,
    };
    return axiosClient.post('/iam-service/api/v1/auth/login', payload);
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
    return axiosClient.post('/iam-service/api/v1/auth/register', data);
  },

  getProfile: async (): Promise<ApiResponse<UserProfileResponse>> => {
    return axiosClient.get('/iam-service/api/v1/user/me');
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const deviceFingerPrint = await getDeviceFingerprint();
    return axiosClient.post('/iam-service/api/v1/auth/logout', { deviceFingerPrint });
  },
};
