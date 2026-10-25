import React, { useState, useEffect } from 'react';
import { Course, Lesson, Quiz } from '../../types';
import { VideoPlayer } from '../player/VideoPlayer';
import { QuizModal } from '../quiz/QuizModal';
import { 
  ArrowLeft, Award, CheckCircle2, Circle, PlayCircle, HelpCircle, 
  ChevronDown, ChevronUp, FileText, Download, MessageSquare, Send, 
  Sparkles, ShieldCheck, Check, Clock, BookOpen, Layers, CheckCheck, AlertCircle, Loader2,
  Heart, Reply, Trash2, CornerDownRight, RefreshCw, User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import enrollmentApi, { type EnrollmentDto } from '../../api/enrollmentApi';
import commentApi, { type LessonCommentItem } from '../../api/commentApi';
import { lessonAttachmentApi, type LessonAttachmentItem } from '../../api/lessonAttachmentApi';

interface LearningRoomProps {
  course: Course;
  /** Lượt ghi danh thật của người dùng cho khóa học này; null nghĩa là chưa ghi danh. */
  enrollment: EnrollmentDto | null;
  /** Chế độ xem trước dành cho giảng viên/quản trị, không ghi tiến độ hoặc làm quiz. */
  previewMode?: boolean;
  onBack: () => void;
  onOpenCertificate: () => void;
}

export const LearningRoom: React.FC<LearningRoomProps> = ({
  course,
  enrollment,
  previewMode = false,
  onBack,
  onOpenCertificate
}) => {
  // Danh sách bài học và bài kiểm tra
  const allLessons = course.sections.flatMap(s => s.lessons);
  const allQuizzes = course.sections.map(s => s.quiz).filter((q): q is Quiz => !!q);
  const totalItemsCount = allLessons.length + allQuizzes.length;

  const [currentLessonId, setCurrentLessonId] = useState<string>(
    allLessons[0]?.id || ''
  );
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [progressLoading, setProgressLoading] = useState<boolean>(!!enrollment);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'qa'>('overview');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [passedQuizIds, setPassedQuizIds] = useState<string[]>([]);

  // Q&A Comments State
  const [comments, setComments] = useState<LessonCommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null);

  // Lesson Attachments / Resources State (Hạng mục E)
  const [attachments, setAttachments] = useState<LessonAttachmentItem[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);

  const loadAttachments = async (lessonId: string) => {
    if (!lessonId) {
      setAttachments([]);
      return;
    }
    setLoadingAttachments(true);
    setAttachmentsError(null);
    try {
      const data = await lessonAttachmentApi.getAttachments(lessonId);
      setAttachments(data || []);
    } catch (e: any) {
      console.warn('Lỗi lấy tài liệu bài học:', e);
      setAttachmentsError(e?.message || 'Không thể tải tài liệu đính kèm.');
    } finally {
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    if (currentLessonId) {
      void loadAttachments(currentLessonId);
    }
  }, [currentLessonId]);

  // Tiến độ lấy từ server; trước đây màn hình tự đánh dấu sẵn bài đầu tiên là xong
  useEffect(() => {
    if (!enrollment) {
      setProgressLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setProgressLoading(true);
      setProgressError(null);
      try {
        const progress = await enrollmentApi.getEnrollmentProgress(enrollment.id);
        if (!cancelled) {
          const completedFromDb = progress.filter(item => item.isCompleted).map(item => item.lessonId);
          setCompletedLessonIds(completedFromDb);
        }
      } catch (err: any) {
        if (!cancelled) setProgressError(err?.message || 'Không tải được tiến độ học tập.');
      } finally {
        if (!cancelled) setProgressLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [enrollment]);

  /**
   * Khôi phục trạng thái "đã đạt" của từng bài kiểm tra từ lịch sử làm bài trên
   * server. Trước đây chỉ giữ trong state nên F5 là mất, dù backend có lưu.
   */
  useEffect(() => {
    if (!enrollment) return;

    const quizIds = course.sections
      .map(section => section.quiz?.id)
      .filter((id): id is string => !!id);
    if (quizIds.length === 0) return;

    let cancelled = false;
    void (async () => {
      const passed = await Promise.all(quizIds.map(async quizId => {
        try {
          const attempts = await enrollmentApi.getQuizAttempts(enrollment.id, quizId);
          return attempts.some(attempt => attempt.isPassed) ? quizId : null;
        } catch (err) {
          console.warn(`Không đọc được lịch sử làm bài của quiz ${quizId}:`, err);
          return null;
        }
      }));
      if (cancelled) return;
      const passedIds = passed.filter((id): id is string => !!id);
      if (passedIds.length > 0) {
        setPassedQuizIds(prev => Array.from(new Set([...prev, ...passedIds])));
      }
    })();

    return () => { cancelled = true; };
  }, [enrollment, course.sections]);

  // Nạp danh sách câu hỏi thảo luận khi đổi bài học hoặc tab Q&A
  const loadComments = async (lessonId: string) => {
    if (!lessonId) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const page = await commentApi.getCommentsByLesson(lessonId, { page: 0, size: 50 });
      setComments(page.items);
    } catch (err: any) {
      console.warn('Không tải được thảo luận bài học:', err);
      setCommentsError(err?.message || 'Không thể tải thảo luận bài học.');
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'qa' && currentLessonId) {
      void loadComments(currentLessonId);
    }
  }, [activeTab, currentLessonId]);

  const handlePostComment = async (e: React.FormEvent, parentId?: string | null) => {
    e.preventDefault();
    const content = parentId ? replyText.trim() : newCommentText.trim();
    if (!content || !currentLessonId) return;

    setSubmittingComment(true);
    setCommentsError(null);
    try {
      await commentApi.createComment(course.id, currentLessonId, {
        content,
        parentId: parentId || undefined,
      });
      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setNewCommentText('');
      }
      await loadComments(currentLessonId);
    } catch (err: any) {
      setCommentsError(err?.message || 'Không thể gửi bình luận. Bạn cần ghi danh để thảo luận.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    setLikingCommentId(commentId);
    try {
      await commentApi.likeComment(commentId);
      await loadComments(currentLessonId);
    } catch (err) {
      console.warn('Lỗi thích bình luận:', err);
    } finally {
      setLikingCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await commentApi.deleteComment(commentId);
      await loadComments(currentLessonId);
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa bình luận.');
    }
  };

  const currentLesson = allLessons.find(l => l.id === currentLessonId) || allLessons[0];
  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLessonId);

  // Tính toán tiến độ bao gồm cả video bài học và bài kiểm tra Quiz
  const completedVideoCount = allLessons.filter(l => completedLessonIds.includes(l.id)).length;
  const completedQuizCount = allQuizzes.filter(q => passedQuizIds.includes(q.id) || completedLessonIds.includes(q.id)).length;
  const completedCount = completedVideoCount + completedQuizCount;
  const progressPercent = totalItemsCount > 0 
    ? Math.min(100, Math.round((completedCount / totalItemsCount) * 100))
    : 0;
  const isAllCompleted = progressPercent === 100;
  /** Chứng chỉ chỉ mở khi đã ghi danh thật và tiến độ đã tải xong từ server */
  const canGetCertificate = isAllCompleted && !!enrollment && !progressLoading;

  /** Video xem đủ 80% hoặc kết thúc: ghi tiến độ lên server. */
  const handleLessonComplete = async (lessonId: string) => {
    if (!enrollment || completedLessonIds.includes(lessonId)) return;

    setProgressError(null);
    try {
      await enrollmentApi.updateLessonProgress(enrollment.id, lessonId, { isCompleted: true });
      const nextCompleted = [...completedLessonIds, lessonId];
      setCompletedLessonIds(nextCompleted);

      const nextVideoDone = allLessons.filter(l => nextCompleted.includes(l.id)).length;
      if (nextVideoDone + completedQuizCount >= totalItemsCount) {
        triggerCompletionConfetti();
      }
    } catch (err: any) {
      setProgressError(err?.message || 'Không lưu được tiến độ lên máy chủ.');
    }
  };

  const triggerCompletionConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });
    } catch (e) {
      // Ignore if not supported
    }
  };

  const toggleSectionAccordion = (secId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setCurrentLessonId(allLessons[currentLessonIndex + 1].id);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonId(allLessons[currentLessonIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-100 flex flex-col font-sans selection:bg-[#2563eb]/30">
      {/* Top Bar (Cinema Mode Header) */}
      <header className="bg-[#0f172a] border-b border-slate-800 px-4 md:px-6 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Back & Course Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại danh mục</span>
            </button>
            <div className="h-5 w-[1px] bg-slate-700 hidden sm:block"></div>
            <div className="truncate">
              <h1 className="text-xs md:text-sm font-bold text-white truncate max-w-md md:max-w-xl">
                {course.title}
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                Bài giảng hiện tại: <span className="text-emerald-400 font-medium">{currentLesson?.title}</span>
              </p>
            </div>
          </div>

          {/* Right: Progress & Certificate CTA */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-2.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <div className="w-24 md:w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isAllCompleted ? 'bg-[#27ae60]' : 'bg-[#2563eb]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-white">
                {progressPercent}%
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                ({completedCount}/{totalItemsCount} bài)
              </span>
            </div>

            {/* Certificate Action Button */}
            <button
              onClick={onOpenCertificate}
              disabled={!canGetCertificate}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                canGetCertificate
                  ? 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white animate-bounce ring-2 ring-amber-300/40 cursor-pointer shadow-red-900/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
              title={canGetCertificate ? 'Bấm để xem và tải chứng chỉ tốt nghiệp!' : 'Hoàn thành 100% bài học để mở khóa chứng chỉ'}
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>{canGetCertificate ? 'Nhận Chứng Chỉ Ngay 🎓' : 'Chứng chỉ (Khóa)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Trạng thái ghi danh và tiến độ */}
      {previewMode && (
        <div className="max-w-7xl w-full mx-auto px-3 md:px-6 pt-4">
          <div className="p-3 bg-sky-950/40 border border-sky-700/50 rounded-xl text-xs text-sky-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Đang xem trước khóa học. Tiến độ, bài kiểm tra và chứng chỉ của học viên không được ghi nhận ở chế độ này.</span>
          </div>
        </div>
      )}
      {!enrollment && !previewMode && (
        <div className="max-w-7xl w-full mx-auto px-3 md:px-6 pt-4">
          <div className="p-3 bg-amber-950/40 border border-amber-700/50 rounded-xl text-xs text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Bạn chưa ghi danh khóa học này nên tiến độ sẽ không được lưu. Hãy đăng ký học
              để bắt đầu tính tiến độ và nhận chứng chỉ.
            </span>
          </div>
        </div>
      )}

      {progressLoading && (
        <div className="max-w-7xl w-full mx-auto px-3 md:px-6 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải tiến độ học tập...
          </div>
        </div>
      )}

      {progressError && (
        <div className="max-w-7xl w-full mx-auto px-3 md:px-6 pt-4">
          <div className="p-3 bg-rose-950/40 border border-rose-700/50 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{progressError}</span>
          </div>
        </div>
      )}

      {/* Main Learning Workspace (Cinema Layout) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player & Tabs (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* HLS Video Player */}
          {currentLesson && (
            <VideoPlayer
              lessonId={currentLesson.id}
              lessonTitle={currentLesson.title}
              mediaId={currentLesson.mediaId}
              isEncrypted={currentLesson.isHlsEncrypted}
              onLessonComplete={handleLessonComplete}
              isCompleted={completedLessonIds.includes(currentLesson.id)}
            />
          )}

          {/* Lesson Navigation and Info Bar */}
          <div className="bg-[#0f172a] rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[11px] font-semibold text-[#2563eb] uppercase tracking-wider">
                Đang xem bài học
              </span>
              <h2 className="text-base md:text-lg font-bold text-white mt-0.5">
                {currentLesson?.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevLesson}
                disabled={currentLessonIndex <= 0}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Bài trước
              </button>
              <button
                onClick={handleNextLesson}
                disabled={currentLessonIndex >= allLessons.length - 1}
                className="px-3 py-1.5 text-xs font-semibold bg-[#2c3e50] hover:bg-[#34495e] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Bài tiếp theo
              </button>
            </div>
          </div>

          {/* Tabs Section (Overview, Resources, Q&A) */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden shadow-md">
            {/* Tab Headers */}
            <div className="flex border-b border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'overview'
                    ? 'border-[#2563eb] text-[#2563eb] bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Tổng quan & Ghi chú
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'resources'
                    ? 'border-[#2563eb] text-[#2563eb] bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Tài liệu ({attachments.length})
              </button>

              <button
                onClick={() => setActiveTab('qa')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'qa'
                    ? 'border-[#2563eb] text-[#2563eb] bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Hỏi đáp Q&A
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-5 text-sm">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      Mục tiêu kiến thức bài học
                    </h3>
                    <p className="mt-2 text-slate-300 leading-relaxed">
                      {currentLesson?.summary}
                    </p>
                  </div>

                  <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Thông tin kỹ thuật Streaming Media:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400 font-mono">
                      {/* Chỉ nói tới mã hoá khi bài học thực sự là luồng HLS mã hoá.
                          Trước đây luôn ghi "AES-128 HLS" và "media-service:8082" dù
                          dữ liệu thật không có thông tin đó. */}
                      <div>
                        Mã hóa:{' '}
                        <span className={currentLesson?.isHlsEncrypted ? 'text-emerald-400' : 'text-slate-300'}>
                          {currentLesson?.isHlsEncrypted ? 'AES-128 HLS' : 'Không (video thường)'}
                        </span>
                      </div>
                      <div>
                        Tiến độ yêu cầu:{' '}
                        <span className="text-amber-400">≥ 80% để ghi nhận hoàn thành</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-rose-400" />
                        Tài liệu học tập đính kèm ({attachments.length})
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tải mã nguồn, slides hoặc tài liệu hướng dẫn bổ trợ cho bài học này
                      </p>
                    </div>
                    <button
                      onClick={() => loadAttachments(currentLessonId)}
                      disabled={loadingAttachments}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingAttachments ? 'animate-spin text-rose-400' : ''}`} />
                      Làm mới
                    </button>
                  </div>

                  {loadingAttachments ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                      <span className="text-xs">Đang tải danh sách tài liệu...</span>
                    </div>
                  ) : attachmentsError ? (
                    <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{attachmentsError}</span>
                      </div>
                      <button
                        onClick={() => loadAttachments(currentLessonId)}
                        className="px-2.5 py-1 bg-rose-900/50 hover:bg-rose-900 text-[11px] rounded border border-rose-700/60 font-semibold"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="p-8 bg-slate-900/60 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-300">Bài học này chưa có tài liệu đính kèm</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Giảng viên chưa tải lên tài liệu bổ trợ nào cho bài học này. Hãy theo dõi video và thực hành theo hướng dẫn.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {attachments.map((item) => {
                        const typeBadge = (item.fileType || 'FILE').toUpperCase();
                        const isZip = typeBadge.includes('ZIP') || typeBadge.includes('RAR');
                        const isPdf = typeBadge.includes('PDF');
                        const isDoc = typeBadge.includes('DOC');
                        const isSlide = typeBadge.includes('PPT') || typeBadge.includes('SLIDE');

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                isPdf ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                                isZip ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                                isSlide ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                                isDoc ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                                'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                              }`}>
                                {typeBadge.substring(0, 4)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-slate-200 truncate group-hover:text-white transition-colors">
                                  {item.name}
                                </p>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                                  {item.fileSize && <span>Dung lượng: {item.fileSize}</span>}
                                  {item.createdAt && (
                                    <span>Ngày tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-[#2563eb] text-slate-200 hover:text-white rounded-lg transition-all border border-slate-700 hover:border-[#2563eb] shadow-sm shrink-0 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Tải về
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'qa' && (
                <div className="space-y-6">
                  {/* Header & Refresh */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#2563eb]" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Hỏi đáp & Thảo luận ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadComments(currentLessonId)}
                      disabled={commentsLoading}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${commentsLoading ? 'animate-spin' : ''}`} />
                      Làm mới
                    </button>
                  </div>

                  {commentsError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{commentsError}</span>
                    </div>
                  )}

                  {/* Comment Input Box */}
                  <form onSubmit={e => void handlePostComment(e)} className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          const video = document.querySelector('video');
                          const t = video ? Math.floor(video.currentTime) : 0;
                          const m = Math.floor(t / 60).toString().padStart(2, '0');
                          const s = (t % 60).toString().padStart(2, '0');
                          const tag = `[${m}:${s}] `;
                          setNewCommentText(prev => (prev.includes(tag) ? prev : tag + prev));
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900 rounded-lg border border-indigo-700/50 transition cursor-pointer"
                        title="Tự động lấy vị trí thời gian của video đang phát chèn vào câu hỏi"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Đính kèm thời gian hiện tại
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        placeholder="Đặt câu hỏi hoặc chia sẻ thắc mắc về bài học này..."
                        className="w-full p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Vui lòng giữ văn minh, lịch sự trong cộng đồng học tập.
                      </span>
                      <button
                        type="submit"
                        disabled={submittingComment || !newCommentText.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Gửi câu hỏi
                      </button>
                    </div>
                  </form>

                  {/* Comments List */}
                  {commentsLoading ? (
                    <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
                      <span className="text-xs">Đang tải câu hỏi thảo luận...</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="p-8 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 text-center space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">Chưa có câu hỏi nào cho bài học này</p>
                      <p className="text-[11px] text-slate-500">
                        Hãy là người đầu tiên đặt câu hỏi để nhận trợ giúp từ giảng viên và bạn học!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map(comment => (
                        <div key={comment.id} className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800/80 space-y-3">
                          {/* Top: Avatar, Name, Time */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {comment.userAvatar ? (
                                <img
                                  src={comment.userAvatar}
                                  alt={comment.userName}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-700"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-xs">
                                  {comment.userName?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div>
                                <h5 className="text-xs font-bold text-white">{comment.userName}</h5>
                                <span className="text-[10px] text-slate-500">
                                  {comment.createdAt ? new Date(comment.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleDeleteComment(comment.id)}
                              className="text-slate-600 hover:text-rose-400 transition p-1"
                              title="Xóa bình luận"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Content */}
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pl-10">
                            {comment.content}
                          </p>

                          {/* Actions: Like & Reply */}
                          <div className="flex items-center gap-4 pl-10 pt-1 text-xs text-slate-400">
                            <button
                              type="button"
                              onClick={() => void handleLikeComment(comment.id)}
                              className="flex items-center gap-1.5 hover:text-rose-400 transition cursor-pointer"
                            >
                              <Heart className={`w-3.5 h-3.5 ${comment.likesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                              <span>{comment.likesCount || 0}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(replyingToId === comment.id ? null : comment.id);
                                setReplyText('');
                              }}
                              className="flex items-center gap-1 hover:text-indigo-400 transition cursor-pointer"
                            >
                              <Reply className="w-3.5 h-3.5" />
                              <span>Trả lời</span>
                            </button>
                          </div>

                          {/* Reply Form */}
                          {replyingToId === comment.id && (
                            <form onSubmit={e => void handlePostComment(e, comment.id)} className="pl-10 pt-2 space-y-2">
                              <div className="relative">
                                <textarea
                                  rows={2}
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  placeholder={`Trả lời @${comment.userName}...`}
                                  className="w-full p-2.5 bg-slate-950 border border-indigo-900/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setReplyingToId(null)}
                                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="submit"
                                  disabled={submittingComment || !replyText.trim()}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                                >
                                  {submittingComment ? 'Đang gửi...' : 'Gửi trả lời'}
                                </button>
                              </div>
                            </form>
                          )}

                          {/* Nested Replies List */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="pl-8 pt-2 space-y-2.5 border-l-2 border-slate-800 ml-4">
                              {comment.replies.map(reply => (
                                <div key={reply.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <CornerDownRight className="w-3 h-3 text-slate-600 shrink-0" />
                                      {reply.userAvatar ? (
                                        <img
                                          src={reply.userAvatar}
                                          alt={reply.userName}
                                          className="w-6 h-6 rounded-full object-cover border border-slate-700"
                                        />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                                          {reply.userName?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                      )}
                                      <span className="text-xs font-bold text-indigo-300">{reply.userName}</span>
                                      <span className="text-[10px] text-slate-500">
                                        {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('vi-VN') : ''}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteComment(reply.id)}
                                      className="text-slate-600 hover:text-rose-400 transition p-1"
                                      title="Xóa phản hồi"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <p className="text-xs text-slate-300 leading-relaxed pl-5 whitespace-pre-line">
                                    {reply.content}
                                  </p>

                                  <div className="pl-5 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => void handleLikeComment(reply.id)}
                                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                    >
                                      <Heart className={`w-3 h-3 ${reply.likesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                                      <span>{reply.likesCount || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Curriculum Accordion Sidebar (4 cols) — Cố định & cuộn độc lập theo chuẩn Coursera/YouTube */}
        <div className="lg:col-span-4 sticky top-20 h-[calc(100vh-6rem)] flex flex-col">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex-1 flex flex-col min-h-0">
            {/* Curriculum Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-[#1a2333] border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">CHƯƠNG MỤC KHÓA HỌC</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {completedCount}/{totalItemsCount} Đạt
              </span>
            </div>

            {/* Sections Accordion */}
            <div className="divide-y divide-slate-800/80 flex-1 overflow-y-auto">
              {course.sections.map((section, secIdx) => {
                const isExpanded = expandedSections[section.id] ?? true;
                const sectionCompletedCount = section.lessons.filter(l => completedLessonIds.includes(l.id)).length;
                const isSectionFinished = sectionCompletedCount === section.lessons.length;

                return (
                  <div key={section.id} className="bg-slate-900/40">
                    {/* Section Header Button */}
                    <button
                      onClick={() => toggleSectionAccordion(section.id)}
                      className="w-full text-left p-3.5 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                          Phần {secIdx + 1} • {section.lessons.length} bài học
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 mt-0.5 truncate leading-snug">
                          {section.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSectionFinished && (
                          <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Lesson Items */}
                    {isExpanded && (
                      <div className="bg-[#0b1320] divide-y divide-slate-800/50 py-1">
                        {section.lessons.map(lesson => {
                          const isCurrent = lesson.id === currentLessonId;
                          const isDone = completedLessonIds.includes(lesson.id);

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => setCurrentLessonId(lesson.id)}
                              className={`px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                isCurrent
                                  ? 'bg-[#2563eb]/10 border-l-4 border-[#2563eb] text-white'
                                  : 'hover:bg-slate-800/50 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#27ae60] shrink-0" />
                                ) : isCurrent ? (
                                  <PlayCircle className="w-4 h-4 text-[#2563eb] shrink-0 animate-pulse" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                                )}
                                <div className="truncate">
                                  <p className={`text-xs leading-snug truncate ${
                                    isCurrent ? 'font-bold text-white' : 'font-medium'
                                  }`}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                    <span className="flex items-center gap-1 font-mono">
                                      <Clock className="w-2.5 h-2.5" />
                                      {lesson.durationMinutes} phút
                                    </span>
                                    {lesson.isHlsEncrypted && (
                                      <span className="text-emerald-500 font-mono">HLS AES</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Manual Complete Checkbox Button for fast toggle */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (previewMode) return;
                                  if (isDone) {
                                    setCompletedLessonIds(prev => prev.filter(id => id !== lesson.id));
                                  } else {
                                    handleLessonComplete(lesson.id);
                                  }
                                }}
                                disabled={previewMode}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                  isDone
                                    ? 'bg-[#27ae60] text-white'
                                    : 'border border-slate-600 hover:border-slate-400 text-transparent'
                                }`}
                                title={isDone ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành bài học'}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Quiz Item at end of section */}
                        {section.quiz && (() => {
                          const isQuizPassed = passedQuizIds.includes(section.quiz!.id);
                          return (
                            <div
                              onClick={() => { if (!previewMode) setActiveQuiz(section.quiz!); }}
                              className={`px-3 py-2.5 flex items-center justify-between gap-3 transition-colors bg-amber-950/20 hover:bg-amber-900/30 border-l-4 ${previewMode ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${
                                isQuizPassed ? 'border-emerald-500' : 'border-amber-500'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <HelpCircle className={`w-4 h-4 shrink-0 ${
                                  isQuizPassed ? 'text-emerald-400' : 'text-amber-400'
                                }`} />
                                <div className="truncate">
                                  <p className="text-xs font-bold text-amber-200 truncate">
                                    {section.quiz.title}
                                  </p>
                                  <span className="text-[10px] text-amber-400 font-semibold">
                                    {section.quiz.questions.length > 0
                                      ? `${section.quiz.questions.length} câu hỏi`
                                      : 'Chưa có câu hỏi'}
                                    {isQuizPassed && ' • Đã đạt'}
                                  </span>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 shrink-0">
                                {isQuizPassed ? 'Xem lại' : 'Làm Quiz'}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Helper Badge */}
            <div className="p-3 bg-[#0b1320] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Đạt 100% mở khóa chứng chỉ A4</span>
              <span className="text-[#2563eb] font-semibold">EduTech LMS 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Modal if open */}
      {activeQuiz && !previewMode && (
        <QuizModal
          quiz={activeQuiz}
          enrollmentId={enrollment?.id ?? null}
          onClose={() => setActiveQuiz(null)}
          onQuizPassed={() => {
            const nextPassed = Array.from(new Set([...passedQuizIds, activeQuiz.id]));
            setPassedQuizIds(nextPassed);
            setCompletedLessonIds(prev => Array.from(new Set([...prev, activeQuiz.id])));

            const nextTotalDone = allLessons.filter(l => completedLessonIds.includes(l.id)).length +
              allQuizzes.filter(q => nextPassed.includes(q.id) || completedLessonIds.includes(q.id)).length;
            if (nextTotalDone >= totalItemsCount) {
              triggerCompletionConfetti();
            }
          }}
        />
      )}
    </div>
  );
};
