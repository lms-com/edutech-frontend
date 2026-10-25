import axiosClient from './axiosClient';
import { API_BASE_URL } from './config';

export interface PresignedUrlResponse {
  uploadUrl: string;
  mediaId: string;
  storedFileName?: string;
}

export interface MediaStatusResponse {
  id: string;
  originalFileName: string;
  storedFileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileSize?: number;
  hlsManifestUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const mediaApi = {
  // 1. Lấy URL nạp luồng phát HLS (index.m3u8) qua API Gateway
  getHlsStreamUrl: (mediaId: string): string => {
    return `${API_BASE_URL}/media-service/api/v1/media/${mediaId}/view`;
  },

  // 2. Yêu cầu cấp Presigned URL để upload video trực tiếp lên MinIO storage
  getPresignedUploadUrl: async (originalFileName: string, contentType: string, fileSize?: number): Promise<PresignedUrlResponse> => {
    const res: any = await axiosClient.post('/media-service/api/v1/media/upload-url', {
      originalFileName,
      contentType: contentType || 'video/mp4',
      fileSize: fileSize || 0,
    });
    return res?.data || res;
  },

  // 2.1. Xác nhận đã upload xong lên MinIO (bắt đầu kích hoạt FFmpeg worker)
  confirmUpload: async (mediaId: string): Promise<void> => {
    await axiosClient.post(`/media-service/api/v1/media/${mediaId}/confirm`);
  },

  // 2.2. Kiểm tra trạng thái xử lý video (PENDING -> PROCESSING -> COMPLETED/FAILED)
  getMediaStatus: async (mediaId: string): Promise<MediaStatusResponse> => {
    const res: any = await axiosClient.get(`/media-service/api/v1/media/${mediaId}/status`);
    return res?.data || res;
  },

  // 3. Upload file trực tiếp lên MinIO bằng Presigned URL
  uploadDirectToMinIO: async (uploadUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      // MinIO PUT presigned URL: nếu content-type được gửi thì đặt, nếu rỗng thì video/mp4
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload thất bại với mã lỗi HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Lỗi kết nối mạng khi tải trực tiếp lên MinIO storage.'));
      xhr.ontimeout = () => reject(new Error('Hết thời gian chờ (timeout) khi tải file lên MinIO.'));
      xhr.send(file);
    });
  },
};

export default mediaApi;
