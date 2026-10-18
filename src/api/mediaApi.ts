import axiosClient from './axiosClient';

export interface PresignedUrlResponse {
  uploadUrl: string;
  mediaId: string;
  storedFileName: string;
}

export const mediaApi = {
  // 1. Lấy URL nạp luồng phát HLS (index.m3u8) qua API Gateway
  getHlsStreamUrl: (mediaId: string): string => {
    return `http://localhost:8080/media-service/stream/${mediaId}/index.m3u8`;
  },

  // 2. Yêu cầu cấp Presigned URL để upload video trực tiếp lên MinIO storage
  getPresignedUploadUrl: async (originalFileName: string, contentType: string, fileSize?: number): Promise<PresignedUrlResponse> => {
    const res: any = await axiosClient.post('/media-service/api/v1/media/upload-url', {
      originalFileName,
      contentType,
      fileSize: fileSize || 0,
    });
    return res?.data || res;
  },

  // 2.1. Xác nhận đã upload xong lên MinIO
  confirmUpload: async (mediaId: string): Promise<void> => {
    await axiosClient.post(`/media-service/api/v1/media/${mediaId}/confirm`);
  },

  // 3. Upload file trực tiếp lên MinIO bằng Presigned URL
  uploadDirectToMinIO: async (uploadUrl: string, file: File, onProgress?: (pct: number) => void) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);

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
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    });
  },
};

export default mediaApi;
