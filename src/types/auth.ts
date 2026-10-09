export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceFingerPrint: string;
}

export interface LoginResponse {
  accessToken: string;
  userId: string;
  email: string;
  permissions?: string[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  dob?: string; // YYYY-MM-DD
}

export interface RegisterResponse {
  email: string;
  userId: string;
  message: string;
}

export interface UserProfileResponse {
  userId: string;
  email: string;
  fullName: string;
  dob?: string;
  roles: string[];
  permissions?: string[];
  profile?: unknown;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface RegisterInitRequest {
  email: string;
  fullName: string;
  password: string;
}

export interface RegisterConfirmRequest {
  email: string;
  otp: string;
  deviceFingerPrint?: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  deviceFingerPrint: string;
}

export interface SecurityStatusResponse {
  hasPin: boolean;
  financialSessionActive: boolean;
  remainingSeconds: number;
}

export interface SetupPinRequest {
  pin: string;
}

export interface ChangePinRequest {
  currentPin: string;
  newPin: string;
}

export interface VerifyPinRequest {
  pin: string;
}

export interface ResetPinRequest {
  otp: string;
  newPin: string;
}

export interface ChangePasswordWithOtpRequest {
  otp: string;
  newPassword: string;
}
