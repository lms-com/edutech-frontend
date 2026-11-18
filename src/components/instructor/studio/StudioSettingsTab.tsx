import React, { useEffect, useState } from 'react';
import { Course } from '../../../types';
import courseApi from '../../../api/courseApi';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

interface StudioSettingsTabProps {
  course: Course;
  onCourseUpdated: (updated: Partial<Course>) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onClearError: () => void;
}

export const StudioSettingsTab: React.FC<StudioSettingsTabProps> = ({
  course,
  onCourseUpdated,
  onSuccess,
  onError,
  onClearError,
}) => {
  const [editTitle, setEditTitle] = useState(course.title);
  const [editDescription, setEditDescription] = useState(course.shortDescription);
  const [editPrice, setEditPrice] = useState(String(course.price));
  const [editLevel, setEditLevel] = useState(course.level || 'Cơ bản');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState(course.thumbnail || '');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setEditTitle(course.title);
    setEditDescription(course.shortDescription);
    setEditPrice(String(course.price));
    setEditLevel(course.level || 'Cơ bản');
    setEditThumbnailUrl(course.thumbnail || '');
  }, [course.id, course.title, course.shortDescription, course.price, course.level, course.thumbnail]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingSettings(true);
    onClearError();
    try {
      const levelMap: Record<string, string> = {
        'Cơ bản': 'BEGINNER',
        'Trung cấp': 'INTERMEDIATE',
        'Nâng cao': 'ADVANCED',
        BEGINNER: 'BEGINNER',
        INTERMEDIATE: 'INTERMEDIATE',
        ADVANCED: 'ADVANCED',
      };
      const updated = await courseApi.updateCourse(course.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        thumbnailUrl: editThumbnailUrl.trim() || undefined,
        basePrice: Math.max(0, Number(editPrice) || 0),
        level: levelMap[editLevel] || 'BEGINNER',
      });
      onCourseUpdated({
        ...updated,
        thumbnail: editThumbnailUrl.trim() || course.thumbnail,
      });
      onSuccess('Cập nhật thông tin và hình ảnh khóa học thành công!');
    } catch (err: any) {
      onError(err?.message || 'Không thể cập nhật khóa học.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
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

        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-slate-700">
            Hình ảnh đại diện khóa học (Thumbnail URL)
          </label>
          <div className="relative">
            <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={editThumbnailUrl}
              onChange={e => setEditThumbnailUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... hoặc dán link ảnh trực tiếp"
              className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
            />
          </div>

          {editThumbnailUrl.trim() && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-44 bg-slate-100 flex items-center justify-center">
              <img
                src={editThumbnailUrl}
                alt="Xem trước ảnh bìa"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
                }}
              />
              <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                Ảnh bìa đang hiển thị
              </span>
            </div>
          )}
          <p className="text-[10px] text-slate-400">
            Hình ảnh hiển thị với học viên tại trang danh mục và trang chi tiết khóa học.
          </p>
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
  );
};
