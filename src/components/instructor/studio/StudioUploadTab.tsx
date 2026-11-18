import React, { useRef, useState } from 'react';
import { CourseSection } from '../../../types';
import courseApi from '../../../api/courseApi';
import mediaApi from '../../../api/mediaApi';
import {
  AlertCircle,
  CheckCircle2,
  Film,
  Loader2,
  Play,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

interface StudioUploadTabProps {
  sections: CourseSection[];
  selectedTargetLessonId: string;
  selectedLessonTitle: string;
  onSelectTargetLesson: (lessonId: string, lessonTitle: string) => void;
  onChangeLessonTitle: (title: string) => void;
  onBackToCurriculum: () => void;
  onUpdateLessonVideoLocal: (lessonId: string, mediaId: string, title?: string) => void;
  onReloadCourse: () => Promise<void>;
  onSuccess: (msg: string) => void;
  onPreviewVideo: (mediaId: string, lessonTitle: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const StudioUploadTab: React.FC<StudioUploadTabProps> = ({
  sections,
  selectedTargetLessonId,
  selectedLessonTitle,
  onSelectTargetLesson,
  onChangeLessonTitle,
  onBackToCurriculum,
  onUpdateLessonVideoLocal,
  onReloadCourse,
  onSuccess,
  onPreviewVideo,
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    'IDLE' | 'GETTING_PRESIGNED' | 'UPLOADING' | 'FFMPEG_PROCESSING' | 'COMPLETED' | 'ERROR'
  >('IDLE');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedMediaId, setLastUploadedMediaId] = useState<string | null>(null);
  const [assigningLessonId, setAssigningLessonId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAssignVideoToLesson = async (lessonId: string, mediaId: string) => {
    if (!lessonId || !mediaId) return;
    setIsAssigning(true);
    try {
      await courseApi.updateLessonContent(lessonId, { videoUrl: mediaId });
      onUpdateLessonVideoLocal(lessonId, mediaId);
      onSuccess('Đã gán video vào bài học thành công!');
      await onReloadCourse();
    } catch (err: any) {
      console.error('Lỗi khi gán video:', err);
      setUploadError('Không thể gán video vào bài học: ' + (err?.message || 'Lỗi server'));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRealUpload = async () => {
    if (!selectedVideoFile) {
      setUploadError('Vui lòng chọn một file video (.mp4, .mov, .mkv, v.v.) từ thiết bị.');
      return;
    }

    setUploadError(null);
    setUploadProgress(0);
    setUploadStatus('GETTING_PRESIGNED');

    try {
      const presigned = await mediaApi.getPresignedUploadUrl(
        selectedVideoFile.name,
        selectedVideoFile.type || 'video/mp4',
        selectedVideoFile.size
      );

      const mediaId = presigned.mediaId;
      setLastUploadedMediaId(mediaId);

      setUploadStatus('UPLOADING');
      await mediaApi.uploadDirectToMinIO(presigned.uploadUrl, selectedVideoFile, (pct) => {
        setUploadProgress(pct);
      });

      setUploadStatus('FFMPEG_PROCESSING');
      setUploadProgress(100);
      await mediaApi.confirmUpload(mediaId);

      let attempts = 0;
      const maxAttempts = 60;
      const pollTimer = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await mediaApi.getMediaStatus(mediaId);
          if (statusRes.status === 'COMPLETED') {
            clearInterval(pollTimer);
            setUploadStatus('COMPLETED');

            if (selectedTargetLessonId) {
              try {
                await courseApi.updateLessonContent(selectedTargetLessonId, {
                  videoUrl: mediaId,
                  title: selectedLessonTitle || undefined,
                });
                onUpdateLessonVideoLocal(selectedTargetLessonId, mediaId, selectedLessonTitle || undefined);
                onSuccess('Đã tải video lên MinIO, mã hóa HLS và gán vào bài học thành công!');
                await onReloadCourse();
              } catch (linkErr: any) {
                console.error('Lỗi khi cập nhật bài học với video mới:', linkErr);
                setUploadError('Video đã mã hóa HLS trên MinIO nhưng chưa thể cập nhật bài học: ' + (linkErr?.message || 'Lỗi server'));
              }
            } else {
              onSuccess('Video đã tải lên và mã hóa HLS thành công trên MinIO! Vui lòng chọn bài học để gán video.');
            }
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollTimer);
            setUploadStatus('ERROR');
            setUploadError('Worker FFmpeg gặp lỗi khi bẻ chunk hoặc mã hóa video.');
          } else if (attempts >= maxAttempts) {
            clearInterval(pollTimer);
            setUploadStatus('ERROR');
            setUploadError('Thời gian xử lý video quá lâu. Vui lòng kiểm tra lại sau.');
          }
        } catch (pollErr: any) {
          console.warn('Đang chờ worker hoàn tất...', pollErr);
        }
      }, 2500);
    } catch (err: any) {
      console.error('Lỗi khi tải video lên:', err);
      setUploadStatus('ERROR');
      setUploadError(err.message || 'Đã xảy ra lỗi khi tải video lên MinIO.');
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-3xl">
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" /> Pipeline Thật (MinIO + RabbitMQ + FFmpeg)
          </span>
          <h3 className="font-bold text-lg text-[#2c3e50] mt-1">Tải Video Lên Cụm MinIO Storage & Mã Hóa HLS</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấp Presigned URL trực tiếp từ Media Service, đẩy lên MinIO S3 bucket, Worker FFmpeg tự động bẻ chunk HLS và mã hóa bảo mật AES-128.
          </p>
        </div>
      </div>

      {selectedTargetLessonId ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-800 font-semibold">
              Mục tiêu tải lên: <span className="font-bold underline">{selectedLessonTitle}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onBackToCurriculum}
            className="text-[11px] text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer"
          >
            Đổi bài học khác
          </button>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Vui lòng chọn bài học ở mục bên dưới để hệ thống tự động gán video sau khi mã hóa xong.</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Chọn bài học cần gắn video:
            </label>
            <select
              value={selectedTargetLessonId}
              onChange={(e) => {
                const lId = e.target.value;
                let foundTitle = 'Bài học';
                for (const s of sections) {
                  const found = s.lessons?.find(l => l.id === lId);
                  if (found) {
                    foundTitle = found.title;
                    break;
                  }
                }
                onSelectTargetLesson(lId, foundTitle);
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-[#2c3e50]"
            >
              <option value="">-- Chưa gắn vào bài học nào (chỉ upload) --</option>
              {sections.map(s => (
                <optgroup key={s.id} label={`Chương: ${s.title}`}>
                  {s.lessons?.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.title} {l.videoUrl ? '(Đã có video)' : '(Chưa có video)'}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tên bài giảng hiển thị:
            </label>
            <input
              type="text"
              value={selectedLessonTitle}
              onChange={e => onChangeLessonTitle(e.target.value)}
              placeholder="Nhập hoặc đổi tên bài học..."
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
            />
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setSelectedVideoFile(file);
              setUploadError(null);
              setUploadStatus('IDLE');
              setUploadProgress(0);
            }
          }}
          className="hidden"
        />

        <div
          onClick={() => {
            if (uploadStatus === 'IDLE' || uploadStatus === 'COMPLETED' || uploadStatus === 'ERROR') {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed p-6 sm:p-8 rounded-2xl text-center cursor-pointer transition-all space-y-3 ${
            selectedVideoFile
              ? 'border-emerald-500 bg-emerald-50/40'
              : 'border-slate-300 hover:border-[#e74c3c] bg-slate-50'
          }`}
        >
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center transition ${
            selectedVideoFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-[#2c3e50]'
          }`}>
            {selectedVideoFile ? <Film className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
          </div>
          <div>
            {selectedVideoFile ? (
              <>
                <p className="font-bold text-sm text-emerald-900 truncate max-w-md mx-auto">
                  {selectedVideoFile.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dung lượng: <span className="font-semibold text-slate-700">{formatFileSize(selectedVideoFile.size)}</span> • Bấm để chọn file khác
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-xs md:text-sm text-[#2c3e50]">
                  Bấm để chọn file video thật từ máy tính
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hỗ trợ MP4, MOV, MKV, WebM • Tự động mã hóa AES-128 & phát HLS
                </p>
              </>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {(uploadStatus === 'IDLE' || uploadStatus === 'ERROR') && (
          <button
            type="button"
            onClick={handleRealUpload}
            disabled={!selectedVideoFile}
            className="w-full py-3 bg-[#e74c3c] hover:bg-[#c0392b] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Bắt Đầu Tải Lên MinIO & Chuyển Mã HLS</span>
          </button>
        )}

        {uploadStatus !== 'IDLE' && (
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                {uploadStatus === 'GETTING_PRESIGNED' && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>1/3 Đang xin Presigned URL từ media-service...</span>
                  </>
                )}
                {uploadStatus === 'UPLOADING' && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>2/3 Đang tải lên MinIO ({uploadProgress}%)...</span>
                  </>
                )}
                {uploadStatus === 'FFMPEG_PROCESSING' && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>3/3 Worker FFmpeg đang bẻ chunk HLS và mã hóa AES-128...</span>
                  </>
                )}
                {uploadStatus === 'COMPLETED' && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Video đã mã hóa HLS thành công & sẵn sàng phát!</span>
                  </>
                )}
                {uploadStatus === 'ERROR' && (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-rose-400">Quá trình tải lên hoặc xử lý gặp lỗi.</span>
                  </>
                )}
              </span>
              <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  uploadStatus === 'COMPLETED' ? 'bg-emerald-500' : uploadStatus === 'ERROR' ? 'bg-rose-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            {uploadStatus === 'COMPLETED' && lastUploadedMediaId && (
              <div className="pt-3 border-t border-slate-800 space-y-3 font-sans">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-slate-400 text-[11px]">Media ID tạo bởi hệ thống:</p>
                    <code className="text-emerald-400 text-xs font-mono font-bold">{lastUploadedMediaId}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPreviewVideo(lastUploadedMediaId, selectedLessonTitle)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Xem thử Video HLS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadStatus('IDLE');
                        setSelectedVideoFile(null);
                        setUploadProgress(0);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      <span>Tải video khác</span>
                    </button>
                  </div>
                </div>

                {!selectedTargetLessonId && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <p className="text-xs text-slate-300 font-semibold">Gán video này vào một bài học trong khóa:</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={assigningLessonId}
                        onChange={e => setAssigningLessonId(e.target.value)}
                        className="p-1.5 border border-slate-700 rounded-lg text-xs bg-slate-900 text-slate-200 focus:outline-none flex-1"
                      >
                        <option value="">-- Chọn bài học để gán --</option>
                        {sections.map(s => (
                          <optgroup key={s.id} label={`Chương: ${s.title}`}>
                            {s.lessons?.map(l => (
                              <option key={l.id} value={l.id}>
                                {l.title} {l.videoUrl ? '(Đã có video)' : '(Chưa có video)'}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!assigningLessonId || isAssigning}
                        onClick={() => handleAssignVideoToLesson(assigningLessonId, lastUploadedMediaId)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        {isAssigning ? 'Đang gán...' : 'Gán vào bài'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
