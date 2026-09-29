import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Course, CourseSection, PayoutRequest } from '../../types';
import { MOCK_PAYOUTS } from '../../data/mockData';
import courseApi from '../../api/courseApi';
import { formatVND } from '../../utils/format';
import { 
  Users, 
  DollarSign, 
  Wallet, 
  Star, 
  Plus, 
  UploadCloud, 
  FileVideo, 
  CheckCircle2, 
  Clock, 
  Send, 
  Sparkles, 
  Layers, 
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Settings,
  HelpCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface InstructorStudioProps {
  course: Course;
  onEnterLearningRoom: (course: Course) => void;
  onBackToLearner?: () => void;
  onBackToCourseList?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  DRAFT: { label: 'Bản nháp', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  PENDING: { label: 'Chờ duyệt', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
  PUBLISHED: { label: 'Đã xuất bản', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  REJECTED: { label: 'Bị từ chối', badge: 'bg-rose-100 text-rose-900 border-rose-300' },
};

export const InstructorStudio: React.FC<InstructorStudioProps> = ({
  course: initialCourse,
  onEnterLearningRoom,
  onBackToLearner,
  onBackToCourseList,
}) => {
  const [currentCourse, setCurrentCourse] = useState<Course>(initialCourse);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'settings' | 'dashboard' | 'upload' | 'payouts'>('curriculum');
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Curriculum State
  const [sections, setSections] = useState<CourseSection[]>(initialCourse.sections || []);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const sectionInputRef = useRef<HTMLInputElement>(null);

  // Add Lesson Form State per Section
  const [activeAddingLessonSectionId, setActiveAddingLessonSectionId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ'>('VIDEO');
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState(15);
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);

  // Course Settings Form State
  const [editTitle, setEditTitle] = useState(initialCourse.title);
  const [editDescription, setEditDescription] = useState(initialCourse.shortDescription);
  const [editPrice, setEditPrice] = useState(String(initialCourse.price));
  const [editLevel, setEditLevel] = useState(initialCourse.level || 'Cơ bản');
  const [savingSettings, setSavingSettings] = useState(false);

  // Video Upload Simulation State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'GETTING_PRESIGNED' | 'UPLOADING' | 'FFMPEG_PROCESSING' | 'COMPLETED'>('IDLE');
  const [selectedLessonTitle, setSelectedLessonTitle] = useState('Bài học');

  // Payout Form State
  const [payoutAmount, setPayoutAmount] = useState('5000000');
  const [bankName, setBankName] = useState('Vietcombank (Chi nhánh Tân Bình)');
  const [bankAccount, setBankAccount] = useState('0071001234567');
  const [payoutList, setPayoutList] = useState<PayoutRequest[]>(MOCK_PAYOUTS);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  const loadCourseData = useCallback(async () => {
    setCurriculumLoading(true);
    setCurriculumError(null);
    try {
      const fullDetail = await courseApi.getCourseById(initialCourse.id);
      setCurrentCourse(fullDetail);
      setSections(fullDetail.sections || []);
      setEditTitle(fullDetail.title);
      setEditDescription(fullDetail.shortDescription);
      setEditPrice(String(fullDetail.price));
      setEditLevel(fullDetail.level || 'Cơ bản');
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không tải được chi tiết giáo trình.');
    } finally {
      setCurriculumLoading(false);
    }
  }, [initialCourse.id]);

  useEffect(() => {
    void loadCourseData();
  }, [loadCourseData]);

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Submit Course for Review (DRAFT/REJECTED -> PENDING)
  const handleSubmitForReview = async () => {
    if (sections.length === 0) {
      setCurriculumError('Khóa học phải có ít nhất 1 chương học trước khi gửi duyệt. Bạn hãy nhập tên chương ở ô bên dưới.');
      sectionInputRef.current?.focus();
      return;
    }
    setActionLoading(true);
    setCurriculumError(null);
    try {
      await courseApi.changeCourseStatus(currentCourse.id, 'PENDING');
      showSuccess('Đã gửi khóa học lên ban quản trị xét duyệt thành công!');
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể gửi duyệt khóa học.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Settings / Metadata
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingSettings(true);
    setCurriculumError(null);
    try {
      const levelMap: Record<string, string> = {
        'Cơ bản': 'BEGINNER',
        'Trung cấp': 'INTERMEDIATE',
        'Nâng cao': 'ADVANCED',
        'BEGINNER': 'BEGINNER',
        'INTERMEDIATE': 'INTERMEDIATE',
        'ADVANCED': 'ADVANCED'
      };
      const updated = await courseApi.updateCourse(currentCourse.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        basePrice: Math.max(0, Number(editPrice) || 0),
        level: levelMap[editLevel] || 'BEGINNER',
      });
      setCurrentCourse(prev => ({ ...prev, ...updated }));
      showSuccess('Cập nhật thông tin khóa học thành công!');
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể cập nhật khóa học.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Add Section via Real API
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) {
      setCurriculumError('Vui lòng nhập tên chương học trước khi bấm Thêm chương.');
      sectionInputRef.current?.focus();
      return;
    }
    setAddingSection(true);
    setCurriculumError(null);
    try {
      await courseApi.createSection({
        courseId: currentCourse.id,
        title: newSectionTitle.trim(),
        orderIndex: sections.length + 1,
      });
      setNewSectionTitle('');
      showSuccess('Đã thêm chương học mới thành công!');
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể tạo chương học.');
    } finally {
      setAddingSection(false);
    }
  };

  // Delete Section via Real API
  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chương "${sectionTitle}" và toàn bộ bài học bên trong?`)) return;
    setCurriculumLoading(true);
    setCurriculumError(null);
    try {
      await courseApi.deleteSection(sectionId);
      showSuccess(`Đã xóa chương "${sectionTitle}".`);
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể xóa chương học.');
    } finally {
      setCurriculumLoading(false);
    }
  };

  // Add Lesson via Real API
  const handleAddLesson = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    setAddingLesson(true);
    setCurriculumError(null);
    try {
      await courseApi.createLesson(sectionId, {
        title: lessonTitle.trim(),
        type: lessonType,
        duration: Math.max(60, lessonDurationMinutes * 60),
        videoUrl: lessonVideoUrl.trim() || undefined,
        freePreview: false,
      });
      setLessonTitle('');
      setLessonVideoUrl('');
      setActiveAddingLessonSectionId(null);
      showSuccess('Đã thêm bài học mới thành công!');
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể tạo bài học.');
    } finally {
      setAddingLesson(false);
    }
  };

  // Delete Lesson via Real API
  const handleDeleteLesson = async (lessonId: string, lessonTitleToDelete: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài học "${lessonTitleToDelete}"?`)) return;
    setCurriculumLoading(true);
    setCurriculumError(null);
    try {
      await courseApi.deleteLesson(lessonId);
      showSuccess(`Đã xóa bài học "${lessonTitleToDelete}".`);
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể xóa bài học.');
    } finally {
      setCurriculumLoading(false);
    }
  };

  // Handle Video Upload Simulation
  const handleSimulateUpload = () => {
    setUploadStatus('GETTING_PRESIGNED');
    setUploadProgress(10);
    setTimeout(() => {
      setUploadStatus('UPLOADING');
      let currentProg = 10;
      const interval = setInterval(() => {
        currentProg += 15;
        setUploadProgress(currentProg);
        if (currentProg >= 100) {
          clearInterval(interval);
          setUploadStatus('FFMPEG_PROCESSING');
          setTimeout(() => {
            setUploadStatus('COMPLETED');
          }, 2000);
        }
      }, 300);
    }, 800);
  };

  const handleCreatePayoutRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newReq: PayoutRequest = {
      id: `pay_${Date.now()}`,
      instructorId: currentCourse.instructor?.id || 'inst_01',
      instructorName: currentCourse.instructor?.name || 'Giảng viên',
      amount: amountNum,
      bankName: bankName,
      bankAccount: bankAccount,
      bankOwner: 'GIANG VIEN',
      status: 'PENDING',
      requestedAt: 'Vừa xong'
    };

    setPayoutList([newReq, ...payoutList]);
    setPayoutSuccessMsg(`[Bản mẫu] Yêu cầu rút ${formatVND(amountNum)} được ghi nhận trên giao diện mô phỏng.`);
    setTimeout(() => setPayoutSuccessMsg(''), 5000);
  };

  const statusUpper = (currentCourse.status || 'DRAFT').toUpperCase();
  const statusCfg = STATUS_CONFIG[statusUpper] || { label: currentCourse.status, badge: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <div className="space-y-6 pb-16">
      {/* Navigation bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        {onBackToCourseList && (
          <button
            onClick={onBackToCourseList}
            className="inline-flex items-center gap-1.5 hover:text-[#2c3e50] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách khóa học
          </button>
        )}
        {onBackToLearner && (
          <button
            onClick={onBackToLearner}
            className="inline-flex items-center gap-1.5 hover:text-[#2c3e50] transition-colors cursor-pointer ml-auto"
          >
            ← Về trang học viên
          </button>
        )}
      </div>

      {/* Studio Header Banner */}
      <div className="bg-[#1e293b] text-white p-6 md:p-8 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e74c3c] text-white text-[11px] font-bold uppercase tracking-wider">
                Instructor Studio
              </span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusCfg.badge}`}>
                {statusCfg.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Mã khóa: {currentCourse.id}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {currentCourse.title}
            </h1>
            <p className="text-xs text-slate-300">
              {currentCourse.shortDescription || 'Chưa có mô tả ngắn cho khóa học này.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Submit for review button */}
            {(statusUpper === 'DRAFT' || statusUpper === 'REJECTED') && (
              <button
                disabled={actionLoading}
                onClick={handleSubmitForReview}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi duyệt khóa học
              </button>
            )}

            {statusUpper === 'PENDING' && (
              <span className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Đang chờ duyệt
              </span>
            )}

            <button
              onClick={() => onEnterLearningRoom(currentCourse)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Xem trước học viên
            </button>
          </div>
        </div>

        {/* Rejection Note Warning if REJECTED */}
        {statusUpper === 'REJECTED' && currentCourse.rejectionNote && (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <p className="font-bold text-rose-300">Khóa học bị từ chối phê duyệt từ Ban quản trị</p>
              <p className="text-rose-100 leading-relaxed">{currentCourse.rejectionNote}</p>
              <p className="text-[11px] text-rose-300 pt-1">Vui lòng điều chỉnh lại giáo trình hoặc thông tin theo góp ý ở trên và bấm "Gửi duyệt khóa học" lại.</p>
            </div>
          </div>
        )}
      </div>

      {/* Global Alert / Feedback */}
      {actionSuccessMsg && (
        <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {curriculumError && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{curriculumError}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'curriculum', label: 'Soạn giáo trình (Curriculum)', icon: Layers },
          { id: 'settings', label: 'Cài đặt khóa học', icon: Settings },
          { id: 'dashboard', label: 'Bảng số liệu KPI', icon: Users },
          { id: 'upload', label: 'Upload Video MinIO (HLS)', icon: UploadCloud },
          { id: 'payouts', label: 'Ví & Yêu cầu Rút tiền', icon: Wallet }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#2c3e50] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CURRICULUM BUILDER (REAL API) */}
      {activeTab === 'curriculum' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[#2c3e50]">Quản lý Chương & Bài giảng</h3>
              <p className="text-xs text-slate-500">Mọi thay đổi được lưu trực tiếp vào cơ sở dữ liệu của hệ thống qua Course Service.</p>
            </div>

            {/* Add Section Form in Header */}
            <form onSubmit={handleAddSection} className="flex items-center gap-2">
              <input
                ref={sectionInputRef}
                type="text"
                value={newSectionTitle}
                onChange={e => {
                  setNewSectionTitle(e.target.value);
                  if (curriculumError) setCurriculumError(null);
                }}
                placeholder="Nhập tiêu đề chương mới..."
                className="px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs w-56 sm:w-72"
              />
              <button
                disabled={addingSection}
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {addingSection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Thêm chương
              </button>
            </form>
          </div>

          {curriculumLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang đồng bộ giáo trình từ máy chủ...
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow-xs">
                <Layers className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-800">Khóa học chưa có chương học nào</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Để gửi duyệt khóa học, bạn cần thêm ít nhất 1 chương học và bài giảng. Nhập tên chương bên dưới và bấm nút:
                </p>
              </div>

              <form onSubmit={handleAddSection} className="flex flex-col sm:flex-row items-center gap-2 pt-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={e => {
                    setNewSectionTitle(e.target.value);
                    if (curriculumError) setCurriculumError(null);
                  }}
                  placeholder="Ví dụ: Chương 1: Giới thiệu tổng quan"
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs"
                />
                <button
                  disabled={addingSection}
                  type="submit"
                  className="w-full sm:w-auto whitespace-nowrap px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {addingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Tạo chương đầu tiên
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, idx) => (
                <div key={section.id} className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-[#2c3e50] text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-[#2c3e50]">{section.title}</h4>
                      <span className="text-xs text-slate-400 font-mono">({section.lessons.length} bài học)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSection(section.id, section.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa chương này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons list inside section */}
                  <div className="space-y-2 pl-4 sm:pl-8">
                    {section.lessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <FileVideo className="w-4 h-4 text-[#e74c3c]" />
                          <span className="font-semibold text-slate-700">{lesson.title}</span>
                          {lesson.videoUrl && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Có video
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono text-[11px]">{lesson.durationMinutes} phút</span>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa bài học"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Quiz inside section if any */}
                    {section.quiz && (
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 shadow-xs">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                          <span className="font-bold">{section.quiz.title}</span>
                        </div>
                        <span className="font-semibold text-amber-700">{section.quiz.questions?.length || 0} câu hỏi</span>
                      </div>
                    )}

                    {/* Add Lesson Form per Section */}
                    {activeAddingLessonSectionId === section.id ? (
                      <form onSubmit={e => handleAddLesson(e, section.id)} className="p-4 bg-white rounded-xl border border-indigo-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-900">Thêm bài học vào Chương {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setActiveAddingLessonSectionId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Đóng
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-[11px] font-semibold text-slate-700 space-y-1 sm:col-span-2">
                            Tiêu đề bài học
                            <input
                              required
                              type="text"
                              value={lessonTitle}
                              onChange={e => setLessonTitle(e.target.value)}
                              placeholder="Ví dụ: Giới thiệu cấu trúc dự án"
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </label>
                          <label className="text-[11px] font-semibold text-slate-700 space-y-1">
                            Loại bài học
                            <select
                              value={lessonType}
                              onChange={e => setLessonType(e.target.value as any)}
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="VIDEO">Video bài giảng</option>
                              <option value="QUIZ">Trắc nghiệm Quiz</option>
                            </select>
                          </label>
                          <label className="text-[11px] font-semibold text-slate-700 space-y-1">
                            Thời lượng ước tính (phút)
                            <input
                              type="number"
                              min="1"
                              value={lessonDurationMinutes}
                              onChange={e => setLessonDurationMinutes(Number(e.target.value) || 1)}
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </label>
                          <label className="text-[11px] font-semibold text-slate-700 space-y-1 sm:col-span-2">
                            URL Video (HLS/MP4 hoặc MinIO link)
                            <input
                              type="text"
                              value={lessonVideoUrl}
                              onChange={e => setLessonVideoUrl(e.target.value)}
                              placeholder="https://example.com/videos/lesson1.m3u8 (hoặc để trống tải sau)"
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </label>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            disabled={addingLesson || !lessonTitle.trim()}
                            type="submit"
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {addingLesson && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Lưu bài học
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveAddingLessonSectionId(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-lg cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveAddingLessonSectionId(section.id);
                          setLessonTitle('');
                          setLessonVideoUrl('');
                        }}
                        className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm bài giảng vào chương này
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COURSE SETTINGS (REAL API) */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-base text-[#2c3e50]">Thông tin chung khóa học</h3>
            <p className="text-xs text-slate-500">Chỉnh sửa tiêu đề, mô tả và giá bán khóa học. Cập nhật được ghi thẳng vào database.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 space-y-1">
              Tiêu đề khóa học
              <input
                required
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
              />
            </label>

            <label className="block text-xs font-bold text-slate-700 space-y-1">
              Mô tả chi tiết
              <textarea
                rows={4}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-slate-700 space-y-1">
                Giá bán (VND)
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editPrice}
                  onChange={e => setEditPrice(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700 space-y-1">
                Trình độ
                <select
                  value={editLevel}
                  onChange={e => setEditLevel(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-[#2c3e50]"
                >
                  <option value="Cơ bản">Cơ bản</option>
                  <option value="Trung cấp">Trung cấp</option>
                  <option value="Nâng cao">Nâng cao</option>
                </select>
              </label>
            </div>

            <button
              disabled={savingSettings || !editTitle.trim()}
              type="submit"
              className="px-5 py-2.5 bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: KPI DASHBOARD (MOCK WITH CLEAR NOTICE) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <strong>Bản mẫu giao diện:</strong> Các số liệu thống kê doanh thu và lượt học dưới đây hiện là dữ liệu mẫu trực quan; backend hiện chưa có endpoint tổng hợp KPI theo giảng viên.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tổng học viên đang học</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-[#2c3e50]">18,450</h3>
              <span className="text-[11px] text-emerald-600 font-semibold">+14.2% so với tháng trước</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Doanh thu trong tháng</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-[#2c3e50]">64,500,000 đ</h3>
              <span className="text-[11px] text-emerald-600 font-semibold">82 lượt mua mới</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Số dư ví khả dụng</span>
                <Wallet className="w-4 h-4 text-[#e74c3c]" />
              </div>
              <h3 className="text-2xl font-black text-[#e74c3c]">18,500,000 đ</h3>
              <span className="text-[11px] text-slate-400">Sẵn sàng để rút về ngân hàng</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Điểm đánh giá trung bình</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-[#2c3e50]">4.9 / 5.0</h3>
              <span className="text-[11px] text-slate-400">Từ 1,240 đánh giá</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MINIO VIDEO UPLOAD DEMO */}
      {activeTab === 'upload' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <strong>Chế độ mô phỏng pipeline:</strong> Quy trình cấp Presigned URL và chuyển mã FFmpeg dưới đây đang mô phỏng luồng tải video lên cụm MinIO Storage.
          </div>

          <div>
            <h3 className="font-bold text-base text-[#2c3e50]">Mô phỏng Tải Video Lên Cụm MinIO Storage & Mã Hóa HLS AES-128</h3>
            <p className="text-xs text-slate-500 mt-1">
              Client gửi yêu cầu nhận Presigned URL, đẩy trực tiếp lên MinIO S3 bucket, FFmpeg Worker bẻ mảnh HLS và mã hóa AES-128.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề bài giảng cập nhật video:
              </label>
              <input
                type="text"
                value={selectedLessonTitle}
                onChange={e => setSelectedLessonTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
              />
            </div>

            <div 
              onClick={() => {
                if (uploadStatus === 'IDLE' || uploadStatus === 'COMPLETED') {
                  handleSimulateUpload();
                }
              }}
              className="border-2 border-dashed border-slate-300 hover:border-[#e74c3c] bg-slate-50 p-8 rounded-2xl text-center cursor-pointer transition-all space-y-3"
            >
              <div className="w-14 h-14 rounded-full bg-slate-200 mx-auto flex items-center justify-center text-[#2c3e50]">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-xs md:text-sm text-[#2c3e50]">
                  Bấm để bắt đầu mô phỏng tải video lên MinIO
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tự động phân mảnh chuẩn HLS .m3u8 & AES-128
                </p>
              </div>
            </div>

            {uploadStatus !== 'IDLE' && (
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">
                    {uploadStatus === 'GETTING_PRESIGNED' && '1/3 Đang xin Presigned URL từ media-service...'}
                    {uploadStatus === 'UPLOADING' && `2/3 Đang đẩy trực tiếp lên MinIO S3 bucket (${uploadProgress}%)...`}
                    {uploadStatus === 'FFMPEG_PROCESSING' && '3/3 Worker FFmpeg đang bẻ chunk HLS và mã hóa AES-128...'}
                    {uploadStatus === 'COMPLETED' && '✓ Video đã mã hóa thành công & sẵn sàng phát HLS!'}
                  </span>
                  <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: WALLET & PAYOUTS (MOCK WITH CLEAR NOTICE) */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <strong>Bản mẫu tính năng Rút tiền:</strong> Controller Payout phía backend hiện là class rỗng. Thao tác gửi yêu cầu dưới đây chỉ cập nhật trên giao diện mô phỏng để minh họa luồng nghiệp vụ.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#2c3e50] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#e74c3c]" />
                Tạo Yêu Cầu Rút Tiền
              </h3>

              {payoutSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-medium">
                  {payoutSuccessMsg}
                </div>
              )}

              <form onSubmit={handleCreatePayoutRequest} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số tiền cần rút (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-[#2c3e50]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngân hàng thụ hưởng:
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số tài khoản:
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi Yêu Cầu Chờ Phê Duyệt
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#2c3e50]">Lịch Sử Yêu Cầu Rút Tiền</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3">Mã GD</th>
                      <th className="p-3">Số tiền</th>
                      <th className="p-3">Ngân hàng</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payoutList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-500">{item.id}</td>
                        <td className="p-3 font-bold text-[#2c3e50]">
                          {formatVND(item.amount)}
                        </td>
                        <td className="p-3 text-slate-600">{item.bankName}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status === 'APPROVED' ? 'Đã duyệt chi' : 'Chờ Admin duyệt'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{item.requestedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
