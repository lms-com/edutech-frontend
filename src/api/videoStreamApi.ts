import axiosClient from './axiosClient';
import { unwrap, type ApiEnvelope } from './response';

export interface VideoStreamStatus {
  active: boolean;
  conflict: boolean;
  message?: string;
  currentSessionId?: string;
  activeDevice?: string;
}

export interface VideoStreamHeartbeatPayload {
  sessionId: string;
  deviceFingerprint?: string;
  clientPlatform?: string;
}

export const videoStreamApi = {
  /**
   * Gửi heartbeat kiểm tra và duy trì phiên phát video
   */
  heartbeat: async (
    lessonId: string,
    payload: VideoStreamHeartbeatPayload
  ): Promise<VideoStreamStatus> => {
    const res = await axiosClient.post<ApiEnvelope<VideoStreamStatus>>(
      `/course-service/api/v1/lessons/${lessonId}/heartbeat`,
      payload
    );
    return unwrap(res);
  },

  /**
   * Chiếm quyền phát video trên thiết bị hiện tại
   */
  claimSession: async (
    lessonId: string,
    payload: VideoStreamHeartbeatPayload
  ): Promise<VideoStreamStatus> => {
    const res = await axiosClient.post<ApiEnvelope<VideoStreamStatus>>(
      `/course-service/api/v1/lessons/${lessonId}/claim-session`,
      payload
    );
    return unwrap(res);
  },

  /**
   * Giải phóng phiên khi học viên dừng xem
   */
  releaseSession: async (lessonId: string, sessionId?: string): Promise<void> => {
    try {
      const url = sessionId
        ? `/course-service/api/v1/lessons/${lessonId}/release-session?sessionId=${encodeURIComponent(sessionId)}`
        : `/course-service/api/v1/lessons/${lessonId}/release-session`;
      await axiosClient.post(url);
    } catch (e) {
      // Best-effort cleanup, ignore error
    }
  },
};
