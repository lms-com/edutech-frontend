import React, { useState } from 'react';
import { Course, Lesson, Quiz } from '../../types';
import { VideoPlayer } from '../player/VideoPlayer';
import { QuizModal } from '../quiz/QuizModal';
import { 
  ArrowLeft, Award, CheckCircle2, Circle, PlayCircle, HelpCircle, 
  ChevronDown, ChevronUp, FileText, Download, MessageSquare, Send, 
  Sparkles, ShieldCheck, Check, Clock, BookOpen, Layers, CheckCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LearningRoomProps {
  course: Course;
  onBack: () => void;
  onOpenCertificate: () => void;
}

export const LearningRoom: React.FC<LearningRoomProps> = ({
  course,
  onBack,
  onOpenCertificate
}) => {
  // Find initial lesson
  const allLessons = course.sections.flatMap(s => s.lessons);
  const totalLessonCount = allLessons.length;

  const [currentLessonId, setCurrentLessonId] = useState<string>(
    allLessons[0]?.id || ''
  );
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    // Initial completed lessons: mark first 2 completed as realistic initial state
    return [allLessons[0]?.id || ''];
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sec_01: true,
    sec_02: true,
    sec_03: true
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'qa'>('overview');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Q&A Comments State
  const [qaComments, setQaComments] = useState<Array<{ id: string; author: string; avatar: string; time: string; text: string }>>([
    {
      id: 'qa_1',
      author: 'Trần Văn Kiên',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      time: '1 giờ trước',
      text: 'Thầy cho em hỏi khi Spring Cloud Gateway chạy sau Nginx reverse proxy thì cấu hình ForwardedHeaderFilter thế nào để không bị mất client IP?'
    },
    {
      id: 'qa_2',
      author: 'TS. Trần Minh Khoa (Giảng viên)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      time: '45 phút trước',
      text: 'Chào Kiên! Em chỉ cần thêm bean XForwardedHeadersFilter trong GatewayConfig và thiết lập trust-proxy trên Nginx là Gateway sẽ nhận đúng IP gốc từ header X-Forwarded-For nhé.'
    }
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Current lesson object
  const currentLesson = allLessons.find(l => l.id === currentLessonId) || allLessons[0];
  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLessonId);

  // Progress calculations
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessonCount > 0 
    ? Math.min(100, Math.round((completedCount / totalLessonCount) * 100))
    : 0;
  const isAllCompleted = progressPercent === 100;

  // Handler when video reaches >= 90% or finishes
  const handleLessonComplete = (lessonId: string) => {
    if (!completedLessonIds.includes(lessonId)) {
      const nextCompleted = [...completedLessonIds, lessonId];
      setCompletedLessonIds(nextCompleted);

      // Check if this reaches 100%
      if (nextCompleted.length === totalLessonCount) {
        triggerCompletionConfetti();
      }
    }
  };

  // Quick 1-click test to achieve 100% completion & unlock certificate immediately
  const handleFastTrackAllComplete = () => {
    const allIds = allLessons.map(l => l.id);
    setCompletedLessonIds(allIds);
    setQuizCompleted(true);
    triggerCompletionConfetti();
  };

  const handleResetProgress = () => {
    setCompletedLessonIds([allLessons[0]?.id || '']);
    setQuizCompleted(false);
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

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setQaComments(prev => [
      ...prev,
      {
        id: `qa_${Date.now()}`,
        author: 'Nguyễn Hoàng Long (Học viên)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        time: 'Vừa xong',
        text: newQuestionText.trim()
      }
    ]);
    setNewQuestionText('');
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

            {/* Quick Demo: Fast-Track 100% Button for instant evaluation */}
            {!isAllCompleted ? (
              <button
                onClick={handleFastTrackAllComplete}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-sm"
                title="Đánh dấu tất cả bài học hoàn thành để mở khóa và xem ngay Chứng chỉ A4"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline">⚡ Hoàn thành 100% ngay</span>
                <span className="md:hidden">100%</span>
              </button>
            ) : (
              <button
                onClick={handleResetProgress}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline px-1"
                title="Đặt lại tiến độ để thử lại luồng học"
              >
                Đặt lại
              </button>
            )}

            {/* Certificate Action Button */}
            <button
              onClick={onOpenCertificate}
              disabled={!isAllCompleted}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                isAllCompleted
                  ? 'bg-[#e74c3c] hover:bg-[#c0392b] text-white animate-bounce ring-2 ring-amber-300/40 cursor-pointer shadow-red-900/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
              title={isAllCompleted ? 'Bấm để xem và tải chứng chỉ tốt nghiệp!' : 'Hoàn thành 100% bài học để mở khóa chứng chỉ'}
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>{isAllCompleted ? 'Nhận Chứng Chỉ Ngay 🎓' : 'Chứng chỉ (Khóa)'}</span>
            </button>
          </div>
        </div>
      </header>

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
                Tài liệu MinIO ({currentLesson?.resources.length || 0})
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
                Hỏi đáp Q&A ({qaComments.length})
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
                      <div>Media ID: <span className="text-slate-200">{currentLesson?.mediaId}</span></div>
                      <div>Mã hóa: <span className="text-emerald-400">AES-128 HLS Segments</span></div>
                      <div>Backend Service: <span className="text-slate-200">media-service:8082</span></div>
                      <div>Tiến độ yêu cầu: <span className="text-amber-400">≥ 90% để ghi nhận hoàn thành</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Tất cả tài liệu được lưu trữ bảo mật trên cụm phân tán MinIO Object Storage:
                  </p>
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
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Bắt đầu tải file: ${res.name} qua MinIO Presigned URL an toàn.`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          Tải về
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'qa' && (
                <div className="space-y-5">
                  {/* List QA comments */}
                  <div className="space-y-3">
                    {qaComments.map(c => (
                      <div key={c.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img src={c.avatar} alt={c.author} className="w-6 h-6 rounded-full object-cover" />
                            <span className="font-bold text-slate-200">{c.author}</span>
                          </div>
                          <span className="text-slate-500 text-[11px]">{c.time}</span>
                        </div>
                        <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Add question form */}
                  <form onSubmit={handleAddQuestion} className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300">
                      Đặt câu hỏi hoặc thảo luận cho giảng viên:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newQuestionText}
                        onChange={e => setNewQuestionText(e.target.value)}
                        placeholder="Nhập nội dung thắc mắc về bài học..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e74c3c]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Gửi
                      </button>
                    </div>
                  </form>
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
                                  if (isDone) {
                                    setCompletedLessonIds(prev => prev.filter(id => id !== lesson.id));
                                  } else {
                                    handleLessonComplete(lesson.id);
                                  }
                                }}
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
                        {section.quiz && (
                          <div 
                            onClick={() => setActiveQuiz(section.quiz!)}
                            className={`px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors bg-amber-950/20 hover:bg-amber-900/30 border-l-4 ${
                              quizCompleted ? 'border-emerald-500' : 'border-amber-500'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <HelpCircle className={`w-4 h-4 shrink-0 ${
                                quizCompleted ? 'text-emerald-400' : 'text-amber-400'
                              }`} />
                              <div className="truncate">
                                <p className="text-xs font-bold text-amber-200 truncate">
                                  {section.quiz.title}
                                </p>
                                <span className="text-[10px] text-amber-400 font-semibold">
                                  {quizCompleted ? '✓ Đã đạt bài trắc nghiệm' : 'Bài kiểm tra trắc nghiệm kết thúc phần'}
                                </span>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 shrink-0">
                              {quizCompleted ? 'Xem lại' : 'Làm Quiz'}
                            </span>
                          </div>
                        )}
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
      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onQuizPassed={(score) => {
            setQuizCompleted(true);
            // Also mark any unfinished lessons in section 1 completed
            course.sections[0]?.lessons.forEach(l => {
              if (!completedLessonIds.includes(l.id)) {
                handleLessonComplete(l.id);
              }
            });
          }}
        />
      )}
    </div>
  );
};
