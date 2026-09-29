import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, ShieldCheck, CheckCircle2, Sparkles, Video, AlertCircle, Loader2 } from 'lucide-react';
import Hls from 'hls.js';
import courseApi from '../../api/courseApi';

interface VideoPlayerProps {
  lessonId: string;
  lessonTitle: string;
  mediaId: string;
  isEncrypted: boolean;
  onLessonComplete: (lessonId: string) => void;
  isCompleted?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lessonId,
  mediaId,
  isEncrypted,
  onLessonComplete,
  isCompleted = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // fallback 120s
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedTriggered, setCompletedTriggered] = useState(isCompleted);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);

  // Never use a video URL embedded in course metadata. Ask the server for a
  // short-lived play URL; course-service checks enrollment/ownership first.
  useEffect(() => {
    let cancelled = false;
    setPlaybackError(null);
    setResolvedVideoUrl(null);
    void courseApi.getLessonPlayUrl(lessonId)
      .then(url => { if (!cancelled) setResolvedVideoUrl(url); })
      .catch((err: any) => {
        if (cancelled) return;
        setPlaybackError(err?.status === 403
          ? 'Bạn cần có quyền học đang hoạt động để xem bài giảng này.'
          : err?.message || 'Không lấy được quyền phát video. Vui lòng thử lại.');
      });
    return () => { cancelled = true; };
  }, [lessonId]);

  // Ngưỡng hoàn thành bài học theo đặc tả THẺ 6: tự động hoàn thành khi xem đạt từ 80%
  const COMPLETION_THRESHOLD = 80;

  // 1. Khởi tạo phát luồng HLS (.m3u8) với Hls.js hoặc fallback native/mp4
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedVideoUrl) return;

    // Hủy phiên HLS cũ nếu đang chạy
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsUrl = resolvedVideoUrl.includes('.m3u8') || resolvedVideoUrl.includes('/stream/');

    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(resolvedVideoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Khôi phục mốc thời gian xem dở từ localStorage
        const savedTime = localStorage.getItem(`edutech_video_pos_${lessonId}`);
        if (savedTime) {
          const time = parseFloat(savedTime);
          video.currentTime = time;
          setCurrentTime(time);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          // Báo lỗi thật cho người học. Trước đây chỗ này âm thầm chuyển sang phát
          // một video mẫu của Google, nên hỏng luồng mà nhìn như đang chạy bình thường.
          console.error('Luồng HLS gặp lỗi không phục hồi được:', data);
          setPlaybackError('Không phát được video bài giảng. Vui lòng thử lại sau.');
        }
      });

      hlsRef.current = hls;
    } else if (isHlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Hỗ trợ Native HLS trên Safari iOS/macOS
      video.src = resolvedVideoUrl;
    } else {
      // Định dạng thông thường hoặc fallback MP4
      video.src = resolvedVideoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [resolvedVideoUrl, lessonId]);

  // 2. Khôi phục vị trí lưu dở khi đổi bài học
  useEffect(() => {
    setCompletedTriggered(isCompleted);
    const savedTime = localStorage.getItem(`edutech_video_pos_${lessonId}`);
    if (savedTime && videoRef.current) {
      const time = parseFloat(savedTime);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [lessonId, isCompleted]);

  // 3. Xử lý Time Update & ghi nhận tiến độ
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration;
    setCurrentTime(current);
    setDuration(dur);
    const pct = dur > 0 ? (current / dur) * 100 : 0;
    setProgressPercent(pct);

    // Lưu checkpoint vào localStorage
    localStorage.setItem(`edutech_video_pos_${lessonId}`, current.toString());

    // Tự động đánh dấu hoàn thành khi xem đạt từ 80% (Theo chuẩn THẺ 6)
    if (pct >= COMPLETION_THRESHOLD && !completedTriggered) {
      setCompletedTriggered(true);
      onLessonComplete(lessonId);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Shortcut thử nghiệm nhanh: Tua thẳng đến 80% để kích hoạt tự động hoàn thành bài học
  const handleFastTrack80 = () => {
    if (videoRef.current) {
      const targetTime = (videoRef.current.duration || 120) * 0.81;
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      setProgressPercent(81);
      setCompletedTriggered(true);
      onLessonComplete(lessonId);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Bài học chưa có video: báo thật thay vì phát một video mẫu không liên quan
  // (trước đây component mặc định phát video demo của Google khi thiếu videoUrl).
  if (!resolvedVideoUrl) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-[#0f172a] shadow-2xl border border-slate-800 flex flex-col items-center justify-center aspect-video gap-3">
        {playbackError ? <AlertCircle className="w-8 h-8 text-amber-400" /> : <Loader2 className="w-8 h-8 animate-spin text-slate-400" />}
        <p className="text-sm font-semibold text-slate-300">{playbackError || 'Đang xác minh quyền xem bài giảng...'}</p>
        {!playbackError && <Video className="w-5 h-5 text-slate-600" />}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 group">
      {playbackError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-slate-950/85 px-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-sm font-semibold text-slate-200">{playbackError}</p>
          <button
            onClick={() => {
              setPlaybackError(null);
              videoRef.current?.load();
            }}
            className="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* AES-128 Encryption & Security Overlay Header */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300">
        {isEncrypted ? (
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 pointer-events-auto shadow-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              HLS AES-128 Stream: <span className="text-emerald-400 font-mono text-[11px]">{mediaId}.m3u8</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase">
              Bảo Mật
            </span>
          </div>
        ) : (
          <div /> /* Không phải luồng mã hoá thì không hiển thị nhãn AES-128 giả */
        )}

        {/* Quick Testing Shortcut */}
        <button
          onClick={handleFastTrack80}
          className="pointer-events-auto bg-[#e74c3c]/90 hover:bg-[#e74c3c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transition-all hover:scale-105"
          title="Tua đến 80% để tự động kích hoạt tiến độ hoàn thành bài học"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Tua 80% (Kích hoạt hoàn thành)
        </button>
      </div>

      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain bg-black cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          onLessonComplete(lessonId);
        }}
        playsInline
      />

      {/* Center Play/Pause Overlay Icon when paused */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-10"
        >
          <div className="w-16 h-16 rounded-full bg-[#e74c3c] text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
            <Play className="w-8 h-8 ml-1" />
          </div>
        </div>
      )}

      {/* Modern Video Controls Bar */}
      <div className="bg-gradient-to-t from-black via-slate-900/90 to-transparent pt-6 pb-3 px-4 flex flex-col gap-2">
        {/* Scrub Bar */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#e74c3c]"
          />
        </div>

        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls: Play, Timestamps, Mute */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:text-[#e74c3c] transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 hover:text-[#e74c3c] transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <span className="font-mono text-slate-300 text-[11px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {progressPercent >= COMPLETION_THRESHOLD && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đạt yêu cầu hoàn thành bài học (&ge; 80%)
              </span>
            )}
          </div>

          {/* Right Controls: Speed, Security Key Info, Fullscreen */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSpeedChange}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 font-mono text-[11px] font-bold text-slate-200 transition-colors"
              title="Thay đổi tốc độ phát video"
            >
              {playbackRate}x
            </button>

            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>HLS.js Protected</span>
            </div>

            <button
              onClick={() => {
                if (videoRef.current) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    videoRef.current.requestFullscreen();
                  }
                }
              }}
              className="p-1.5 hover:text-[#e74c3c] transition-colors"
              title="Toàn màn hình"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
