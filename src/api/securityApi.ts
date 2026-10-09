import axiosClient from './axiosClient';
import type {
  ApiResponse,
  SecurityStatusResponse,
  SetupPinRequest,
  ChangePinRequest,
  VerifyPinRequest,
  ResetPinRequest,
  ChangePasswordWithOtpRequest,
} from '../types/auth';

export const securityApi = {
  getStatus: async (): Promise<ApiResponse<SecurityStatusResponse>> => {
    return axiosClient.get('/iam-service/api/v1/user/security/status');
  },

  setupPin: async (data: SetupPinRequest): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/user/security/pin/setup', data);
  },

  changePin: async (data: ChangePinRequest): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/user/security/pin/change', data);
  },

  verifyPin: async (data: VerifyPinRequest): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/user/security/pin/verify', data);
  },

  sendResetPinOtp: async (): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/user/security/pin/forgot-otp');
  },

  resetPin: async (data: ResetPinRequest): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/user/security/pin/reset', data);
  },

  lockSession: async (): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/user/security/session/lock');
  },

  sendChangePasswordOtp: async (): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/user/security/password/send-otp');
  },

  changePasswordWithOtp: async (data: ChangePasswordWithOtpRequest): Promise<ApiResponse<string>> => {
    return axiosClient.post('/iam-service/api/v1/user/security/password/change-with-otp', data);
  },
};
