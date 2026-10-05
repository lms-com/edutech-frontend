import type { DeviceSession } from '../../types';

export interface AdminDeviceResponseDto {
  deviceId: string;
  deviceFingerprint: string;
  userId?: string;
  userEmail?: string;
  userFullName?: string;
  loginAt?: string;
  lastActive?: string;
  isBlocked?: boolean;
}

export const mapDeviceSession = (dto: AdminDeviceResponseDto, currentFingerprint?: string): DeviceSession => {
  const fp = dto.deviceFingerprint || dto.deviceId || '';
  const isCurrent = Boolean(currentFingerprint && fp === currentFingerprint);

  // Tạo tên thiết bị thân thiện dựa trên fingerprint
  const shortId = fp.length > 8 ? fp.substring(0, 8).toUpperCase() : fp;
  const deviceName = `Thiết bị #${shortId}`;

  return {
    deviceId: dto.deviceId || fp,
    deviceFingerprint: fp,
    deviceName,
    userId: dto.userId,
    userEmail: dto.userEmail,
    userFullName: dto.userFullName,
    lastActive: dto.lastActive || 'Vừa xong',
    loginAt: dto.loginAt,
    isCurrent,
    isBlocked: Boolean(dto.isBlocked),
    browser: 'Web Browser',
    os: 'Client Platform',
    ipAddress: '127.0.0.1',
  };
};
