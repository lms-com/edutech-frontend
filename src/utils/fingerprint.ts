import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedFingerprint: string | null = null;

export const getDeviceFingerprint = async (): Promise<string> => {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  const stored = sessionStorage.getItem('device_fingerprint');
  if (stored) {
    cachedFingerprint = stored;
    return stored;
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    sessionStorage.setItem('device_fingerprint', result.visitorId);
    return result.visitorId;
  } catch (error) {
    console.error('Không thể lấy Device Fingerprint, dùng fallback tạm:', error);
    const fallback = 'browser_' + Math.random().toString(36).substring(2, 15);
    return fallback;
  }
};
