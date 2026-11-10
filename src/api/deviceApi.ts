import axiosClient from './axiosClient';
import { unwrap, type ApiEnvelope } from './response';
import { mapDeviceSession, type AdminDeviceResponseDto } from './mappers/deviceMapper';
import type { DeviceSession } from '../types';

export interface UserDeviceItem {
  deviceFingerprint: string;
  loginAt?: string;
}

export const deviceApi = {
  // Lấy danh sách thiết bị đang hoạt động trên hệ thống (dành cho Admin)
  getAdminDevices: async (search?: string, currentFingerprint?: string): Promise<DeviceSession[]> => {
    const res = await axiosClient.get<ApiEnvelope<AdminDeviceResponseDto[]>>('/iam-service/api/v1/admin/devices', {
      params: search ? { search } : undefined,
    });
    const dtos = unwrap(res);
    return (dtos || []).map(d => mapDeviceSession(d, currentFingerprint));
  },

  // Lấy danh sách thiết bị của một user cụ thể (dành cho Admin)
  getDevicesByUserId: async (userId: string): Promise<UserDeviceItem[]> => {
    const res = await axiosClient.get<ApiEnvelope<UserDeviceItem[]>>(
      `/iam-service/api/v1/admin/users/${userId}/devices`
    );
    return unwrap(res) || [];
  },

  // Thu hồi phiên thiết bị theo chuẩn RESTful DELETE (dành cho Admin)
  deleteDevice: async (userId: string, fingerprint: string): Promise<string> => {
    const res = await axiosClient.delete<ApiEnvelope<string>>(
      `/iam-service/api/v1/admin/users/${userId}/devices/${fingerprint}`
    );
    return unwrap(res);
  },

  // Thu hồi phiên và đưa thiết bị vào danh sách đen (dành cho Admin)
  revokeDevice: async (userId: string, deviceFingerprint: string): Promise<string> => {
    const res = await axiosClient.post<ApiEnvelope<string>>('/iam-service/api/v1/admin/devices/revoke', null, {
      params: { userId, deviceFingerprint },
    });
    return unwrap(res);
  },
};

export default deviceApi;
