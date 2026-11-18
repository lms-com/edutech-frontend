import React, { useState } from 'react';
import { CourseSection } from '../../../types';
import courseApi from '../../../api/courseApi';
import {
  FileText,
  FileVideo,
  HelpCircle,
  Layers,
  Loader2,
  Play,
  Plus,
  Trash2,
  UploadCloud,
} from 'lucide-react';

interface StudioCurriculumTabProps {
  courseId: string;
  sections: CourseSection[];
  curriculumLoading: boolean;
  curriculumError: string | null;
  sectionInputRef: React.RefObject<HTMLInputElement | null>;
  onClearError: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
  onReloadCourse: () => Promise<void>;
  onSetLoading: (loading: boolean) => void;
  onPreviewVideo: (mediaId: string, lessonTitle: string) => void;
  onUploadForLesson: (lessonId: string, lessonTitle: string) => void;
  onOpenAttachments: (lessonId: string, lessonTitle: string) => void;
}

export const StudioCurriculumTab: React.FC<StudioCurriculumTabProps> = ({
  courseId,
  sections,
  curriculumLoading,
  curriculumError,
  sectionInputRef,
  onClearError,
  onError,
  onSuccess,
  onReloadCourse,
  onSetLoading,
  onPreviewVideo,
  onUploadForLesson,
  onOpenAttachments,
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection] = useState(false);

  const [activeAddingLessonSectionId, setActiveAddingLessonSectionId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ'>('VIDEO');
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState(15);
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) {
      onError('Vui lòng nhập tên chương học trước khi bấm Thêm chương.');
      sectionInputRef.current?.focus();
      return;
    }
    setAddingSection(true);
    onClearError();
    try {
      await courseApi.createSection({
        courseId,
        title: newSectionTitle.trim(),
        orderIndex: sections.length + 1,
      });
      setNewSectionTitle('');
      onSuccess('Đã thêm chương học mới thành công!');
      await onReloadCourse();
    } catch (err: any) {
      onError(err?.message || 'Không thể tạo chương học.');
    } finally {
      setAddingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chương "${sectionTitle}" và toàn bộ bài học bên trong?`)) return;
    onSetLoading(true);
    onClearError();
    try {
      await courseApi.deleteSection(sectionId);
      onSuccess(`Đã xóa chương "${sectionTitle}".`);
      await onReloadCourse();
    } catch (err: any) {
      onError(err?.message || 'Không thể xóa chương học.');
    } finally {
      onSetLoading(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    setAddingLesson(true);
    onClearError();
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
      onSuccess('Đã thêm bài học mới thành công!');
      await onReloadCourse();
    } catch (err: any) {
      onError(err?.message || 'Không thể tạo bài học.');
    } finally {
      setAddingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonTitleToDelete: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài học "${lessonTitleToDelete}"?`)) return;
    onSetLoading(true);
    onClearError();
    try {
      await courseApi.deleteLesson(lessonId);
      onSuccess(`Đã xóa bài học "${lessonTitleToDelete}".`);
      await onReloadCourse();
    } catch (err: any) {
      onError(err?.message || 'Không thể xóa bài học.');
    } finally {
      onSetLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-[#2c3e50]">Quản lý Chương & Bài giảng</h3>
          <p className="text-xs text-slate-500">Mọi thay đổi được lưu trực tiếp vào cơ sở dữ liệu của hệ thống qua Course Service.</p>
        </div>

        <form onSubmit={handleAddSection} className="flex items-center gap-2">
          <input
            ref={sectionInputRef}
            type="text"
            value={newSectionTitle}
            onChange={e => {
              setNewSectionTitle(e.target.value);
              if (curriculumError) onClearError();
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
                if (curriculumError) onClearError();
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

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[11px]">{lesson.durationMinutes} phút</span>
                      {lesson.videoUrl && (
                        <button
                          type="button"
                          onClick={() => onPreviewVideo(lesson.videoUrl || '', lesson.title)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 cursor-pointer"
                          title="Xem thử video của bài học này"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Xem</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onUploadForLesson(lesson.id, lesson.title)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 cursor-pointer"
                        title="Tải video lên cho bài học này"
                      >
                        <UploadCloud className="w-3 h-3" />
                        <span>{lesson.videoUrl ? 'Đổi video' : 'Tải video'}</span>
                      </button>
                      <button
                        onClick={() => onOpenAttachments(lesson.id, lesson.title)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-[#e74c3c] bg-slate-100 hover:bg-rose-50 rounded-lg transition border border-slate-200 hover:border-rose-200 cursor-pointer"
                        title="Quản lý tài liệu đính kèm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Tài liệu</span>
                      </button>
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

                {section.quiz && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 shadow-xs">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span className="font-bold">{section.quiz.title}</span>
                    </div>
                    <span className="font-semibold text-amber-700">{section.quiz.questions?.length || 0} câu hỏi</span>
                  </div>
                )}

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
  );
};
