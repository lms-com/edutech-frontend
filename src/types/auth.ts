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
