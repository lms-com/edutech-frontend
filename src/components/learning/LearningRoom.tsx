import React, { useState, useEffect } from 'react';
import { Course, Lesson, Quiz } from '../../types';
import { VideoPlayer } from '../player/VideoPlayer';
import { QuizModal } from '../quiz/QuizModal';
import { 
  ArrowLeft, Award, CheckCircle2, Circle, PlayCircle, HelpCircle, 
  ChevronDown, ChevronUp, FileText, Download, MessageSquare, Send, 
  Sparkles, ShieldCheck, Check, Clock, BookOpen, Layers, CheckCheck, AlertCircle, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import enrollmentApi, { type EnrollmentDto } from '../../api/enrollmentApi';

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
  // Find initial lesson
  const allLessons = course.sections.flatMap(s => s.lessons);
  const totalLessonCount = allLessons.length;

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
          setCompletedLessonIds(progress.filter(item => item.isCompleted).map(item => item.lessonId));
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

  const currentLesson = allLessons.find(l => l.id === currentLessonId) || allLessons[0];
  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLessonId);

  // Progress calculations
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessonCount > 0 
    ? Math.min(100, Math.round((completedCount / totalLessonCount) * 100))
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
      if (nextCompleted.length === totalLessonCount) {
        triggerCompletionConfetti();
      }
    } catch (err: any) {
      // Cố ý KHÔNG đánh dấu hoàn thành tại chỗ khi server ghi thất bại: nếu đánh
      // dấu, người học thấy 100% nhưng tải lại trang là mất sạch.
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
    <div className="min-h-screen bg-[#1e293b] text-slate-100 flex flex-col font-sans selection:bg-[#e74c3c]/30">
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
                    isAllCompleted ? 'bg-[#27ae60]' : 'bg-[#e74c3c]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-white">
                {progressPercent}%
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                ({completedCount}/{totalLessonCount} bài)
              </span>
            </div>

            {/* Certificate Action Button */}
            <button
              onClick={onOpenCertificate}
              disabled={!canGetCertificate}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                canGetCertificate
                  ? 'bg-[#e74c3c] hover:bg-[#c0392b] text-white animate-bounce ring-2 ring-amber-300/40 cursor-pointer shadow-red-900/30'
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
              videoUrl={currentLesson.videoUrl}
              onLessonComplete={handleLessonComplete}
              isCompleted={completedLessonIds.includes(currentLesson.id)}
            />
          )}

          {/* Lesson Navigation and Info Bar */}
          <div className="bg-[#0f172a] rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[11px] font-semibold text-[#e74c3c] uppercase tracking-wider">
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
                    ? 'border-[#e74c3c] text-[#e74c3c] bg-slate-800/40'
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
                    ? 'border-[#e74c3c] text-[#e74c3c] bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Tài liệu ({currentLesson?.resources.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('qa')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'qa'
                    ? 'border-[#e74c3c] text-[#e74c3c] bg-slate-800/40'
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
                <div className="space-y-3">
                  {(currentLesson?.resources.length ?? 0) === 0 ? (
                    <div className="p-6 bg-slate-900 rounded-xl border border-dashed border-slate-700 text-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">Bài học này chưa có tài liệu đính kèm</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Hệ thống chưa có API quản lý tài liệu cho bài học nên mục này luôn trống.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-400">Tài liệu đính kèm của bài học:</p>
                      <div className="space-y-2">
                        {currentLesson?.resources.map((res, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center text-xs font-bold">
                                {res.type}
                              </div>
                              <div>
                                <p className="font-semibold text-xs text-slate-200">{res.name}</p>
                                <span className="text-[10px] text-slate-500">Dung lượng: {res.size}</span>
                              </div>
                            </div>

                            <a
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                              Tải về
                            </a>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'qa' && (
                <div className="p-6 bg-slate-900 rounded-xl border border-dashed border-slate-700 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">Phần hỏi đáp chưa khả dụng</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Hệ thống chưa có API thảo luận theo bài học, nên chưa thể hiển thị hay gửi câu hỏi.
                    Trước đây mục này hiện một cuộc trò chuyện mẫu cho mọi khóa học.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Curriculum Accordion Sidebar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl sticky top-20">
            {/* Curriculum Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-[#1a2333] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#e74c3c]" />
                <h3 className="font-bold text-sm text-white">CHƯƠNG MỤC KHÓA HỌC</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {completedCount}/{totalLessonCount} Đạt
              </span>
            </div>

            {/* Sections Accordion */}
            <div className="divide-y divide-slate-800/80 max-h-[72vh] overflow-y-auto">
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
                                  ? 'bg-[#e74c3c]/10 border-l-4 border-[#e74c3c] text-white'
                                  : 'hover:bg-slate-800/50 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#27ae60] shrink-0" />
                                ) : isCurrent ? (
                                  <PlayCircle className="w-4 h-4 text-[#e74c3c] shrink-0 animate-pulse" />
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
              <span className="text-[#e74c3c] font-semibold">EduTech LMS 2026</span>
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
            // Điểm do server chấm; ở đây chỉ ghi nhận để đổi trạng thái hiển thị
            setPassedQuizIds(prev => prev.includes(activeQuiz.id) ? prev : [...prev, activeQuiz.id]);
          }}
        />
      )}
    </div>
  );
};
