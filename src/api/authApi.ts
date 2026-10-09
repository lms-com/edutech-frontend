import axiosClient from './axiosClient';
import { getDeviceFingerprint } from '../utils/fingerprint';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserProfileResponse,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  RegisterInitRequest,
  RegisterConfirmRequest,
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

  registerInit: async (data: RegisterInitRequest): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/auth/register-otp', data);
  },

  registerConfirm: async (data: Omit<RegisterConfirmRequest, 'deviceFingerPrint'>): Promise<ApiResponse<LoginResponse>> => {
    const deviceFingerPrint = await getDeviceFingerprint();
    const payload: RegisterConfirmRequest = {
      ...data,
      deviceFingerPrint,
    };
    return axiosClient.post('/iam-service/api/v1/auth/verify-register-otp', payload);
  },

  loginWithGoogle: async (idToken: string): Promise<ApiResponse<LoginResponse>> => {
    const deviceFingerPrint = await getDeviceFingerprint();
    return axiosClient.post('/iam-service/api/v1/auth/google', {
      idToken,
      deviceFingerPrint,
    });
  },

  getProfile: async (): Promise<ApiResponse<UserProfileResponse>> => {
    return axiosClient.get('/iam-service/api/v1/user/me');
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const deviceFingerPrint = await getDeviceFingerprint();
    return axiosClient.post('/iam-service/api/v1/auth/logout', { deviceFingerPrint });
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/auth/forgot-password', data);
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/auth/verify-otp', data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/auth/reset-password', data);
  },
};
