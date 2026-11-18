import Hls from 'hls.js';
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Play, X } from 'lucide-react';

export interface VideoHlsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string;
  lessonTitle?: string;
}

export const VideoHlsPreviewModal: React.FC<VideoHlsPreviewModalProps> = ({
  isOpen,
  onClose,
  mediaId,
  lessonTitle,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !mediaId) return;
    setError(null);
    setLoading(true);

    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHttp = mediaId.startsWith('http://') || mediaId.startsWith('https://');
    const isM3u8 = mediaId.includes('.m3u8') || mediaId.includes('/view');
    const isDirectMp4 = isHttp && !isM3u8;

    if (isDirectMp4) {
      // Trường hợp video là link MP4 trực tiếp ngoài (như seed data Google Cloud)
      video.src = mediaId;
      video.onloadeddata = () => {
        setLoading(false);
        video.play().catch(e => console.log('Autoplay muted:', e));
      };
      video.onerror = () => {
        setError('Không thể phát video từ đường dẫn trực tiếp: ' + mediaId);
        setLoading(false);
      };
      return;
    }

    const streamUrl = isHttp ? mediaId : `/media-service/api/v1/media/${mediaId}/view`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr, url) => {
          // Không gửi Authorization / Fingerprint header tới MinIO port 9000
          if (!url.includes(':9000') && !url.includes('.s3.')) {
            const token = localStorage.getItem('access_token');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            const fp = sessionStorage.getItem('device_fingerprint');
            if (fp) xhr.setRequestHeader('X-Device-Fingerprint', fp);
          }
        },
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(e => console.log('Autoplay muted / pending user click:', e));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('Lỗi khi tải stream HLS:', data);
          setError('Không thể kết nối hoặc giải mã luồng HLS AES-128. Vui lòng đảm bảo worker đã xử lý xong.');
          setLoading(false);
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      setLoading(false);
    } else {
      setError('Trình duyệt của bạn không hỗ trợ phát luồng HLS.');
      setLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, mediaId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold flex items-center gap-2">
                Xem thử Video HLS
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  AES-128
                </span>
              </h4>
              <p className="text-slate-400 text-xs truncate max-w-md">
                {lessonTitle ? `Bài học: ${lessonTitle}` : `Media ID: ${mediaId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-950/60 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-xs">Đang nạp luồng video HLS mã hóa...</span>
            </div>
          )}
          {error ? (
            <div className="p-6 text-center text-rose-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-xs font-semibold">{error}</p>
              <p className="text-[11px] text-slate-400">Vui lòng đảm bảo worker đã hoàn tất mã hóa và lưu trữ trên MinIO.</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          )}
        </div>

        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn phát: HLS (.m3u8)
            </span>
            <span>•</span>
            <span>Bảo mật: Mã hóa khóa AES-128 động</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
