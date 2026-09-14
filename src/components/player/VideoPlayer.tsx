import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, ShieldCheck, CheckCircle2, RotateCcw, FastForward, Settings, Sparkles } from 'lucide-react';

interface VideoPlayerProps {
  lessonId: string;
  lessonTitle: string;
  mediaId: string;
  isEncrypted: boolean;
  videoUrl?: string;
  onLessonComplete: (lessonId: string) => void;
  isCompleted?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lessonId,
  lessonTitle,
  mediaId,
  isEncrypted,
  videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  onLessonComplete,
  isCompleted = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // fallback 120s
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedTriggered, setCompletedTriggered] = useState(isCompleted);

  // Restore cached playback time from localStorage
  useEffect(() => {
    setCompletedTriggered(isCompleted);
    const savedTime = localStorage.getItem(`edutech_video_pos_${lessonId}`);
    if (savedTime && videoRef.current) {
      const time = parseFloat(savedTime);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [lessonId, isCompleted]);

  // Handle video time updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration;
    setCurrentTime(current);
    setDuration(dur);
    const pct = dur > 0 ? (current / dur) * 100 : 0;
    setProgressPercent(pct);

    // Save heartbeat to localStorage
    localStorage.setItem(`edutech_video_pos_${lessonId}`, current.toString());

    // Auto mark completed when >= 90%
    if (pct >= 90 && !completedTriggered) {
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

  // Instant fast-track: Jump to 95% to immediately test LMS lesson completion hook
  const handleFastTrack95 = () => {
    if (videoRef.current) {
      const targetTime = (videoRef.current.duration || 120) * 0.95;
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      setProgressPercent(95);
      setCompletedTriggered(true);
      onLessonComplete(lessonId);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 group">
      {/* AES-128 Encryption & Security Overlay Header */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 pointer-events-auto shadow-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            HLS AES-128 Stream: <span className="text-emerald-400 font-mono text-[11px]">{mediaId}.m3u8</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase">
            Bảo Mật
          </span>
        </div>

        {/* Quick Testing Shortcut */}
        <button
          onClick={handleFastTrack95}
          className="pointer-events-auto bg-[#e74c3c]/90 hover:bg-[#e74c3c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transition-all hover:scale-105"
          title="Tua nhanh đến 95% để tự động kích hoạt API cập nhật tiến độ hoàn thành bài học"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Tua 95% (Tự động hoàn thành)
        </button>
      </div>

      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
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

            {progressPercent >= 90 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đạt yêu cầu hoàn thành bài học
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

            <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
              <span>Token:</span>
              <span className="font-mono text-slate-300">AES-128:KEY-OK</span>
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
