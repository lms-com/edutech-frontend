import React, { useCallback, useEffect, useState } from 'react';
import type { Course } from '../../types';
import courseApi, { type CategoryDto } from '../../api/courseApi';
import { CourseThumbnail } from '../common/CourseThumbnail';
import { formatVND } from '../../utils/format';
import { AlertCircle, Loader2, Plus, RefreshCw, Video } from 'lucide-react';

interface InstructorCourseManagerProps {
  onSelectCourse: (course: Course) => void;
  onBackToLearner: () => void;
}

const makeSlug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const InstructorCourseManager: React.FC<InstructorCourseManagerProps> = ({
  onSelectCourse,
  onBackToLearner,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('0');
  const [description, setDescription] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [page, categoryList] = await Promise.all([
        courseApi.getMyCourses({ size: 100 }),
        courseApi.getCategories(),
      ]);
      setCourses(page.items);
      setCategories(categoryList);
      setCategoryId(current => current || categoryList[0]?.id || '');
    } catch (err: any) {
      setError(err?.message || 'Không tải được khóa học của giảng viên.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const createCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !categoryId) return;
    setSaving(true);
    setError(null);
    try {
      const created = await courseApi.createCourse({
        title: title.trim(),
        slug: makeSlug(title),
        categoryId,
        description: description.trim(),
        basePrice: Math.max(0, Number(price) || 0),
        currencyCode: 'VND',
        level: 'BEGINNER',
      });
      setCourses(current => [created, ...current]);
      setFormOpen(false);
      setTitle('');
      setPrice('0');
      setDescription('');
      onSelectCourse(created);
    } catch (err: any) {
      setError(err?.message || 'Không tạo được khóa học.');
    } finally {
      setSaving(false);
    }
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'Bản nháp', PENDING: 'Chờ duyệt', PUBLISHED: 'Đã xuất bản', REJECTED: 'Bị từ chối',
  };
  const statusLabel = (status: string) => statusLabels[status.toUpperCase()] ?? status;

  return (
    <div className="space-y-6 pb-12">
      <button onClick={onBackToLearner} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
        ← Quay lại trang học viên
      </button>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-slate-900 p-6 text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Không gian giảng viên</p>
          <h1 className="mt-1 text-2xl font-extrabold">Quản lý khóa học</h1>
          <p className="mt-2 text-sm text-slate-300">Tạo khóa học và mở riêng khu vực quản lý chương, bài giảng cho từng khóa.</p>
        </div>
        <button onClick={() => setFormOpen(value => !value)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold hover:bg-indigo-500">
          <Plus className="h-4 w-4" /> Tạo khóa học
        </button>
      </section>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      {formOpen && (
        <form onSubmit={createCourse} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-slate-700">Tên khóa học
            <input required value={title} onChange={event => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Ví dụ: React từ cơ bản đến nâng cao" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-700">Danh mục
            <select required value={categoryId} onChange={event => setCategoryId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-700">Giá (VND)
            <input type="number" min="0" step="1000" value={price} onChange={event => setPrice(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-700 md:col-span-2">Mô tả
            <textarea value={description} onChange={event => setDescription(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Mục tiêu và nội dung chính của khóa học" />
          </label>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button disabled={saving || !categoryId} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Tạo bản nháp
            </button>
            <span className="text-xs text-slate-500">Khóa mới được tạo ở trạng thái bản nháp.</span>
          </div>
        </form>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Khóa học của tôi <span className="text-sm font-medium text-slate-400">({courses.length})</span></h2>
        <button onClick={() => void loadData()} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới</button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải khóa học...</div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Video className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-700">Bạn chưa có khóa học nào</p>
          <p className="mt-1 text-sm text-slate-500">Tạo khóa đầu tiên để bắt đầu xây dựng chương trình học.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map(course => (
            <article key={course.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CourseThumbnail src={course.thumbnail} alt={course.title} className="aspect-video w-full bg-slate-100 object-cover" />
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{statusLabel(course.status)}</span>
                  <span className="text-xs font-bold text-slate-700">{formatVND(course.price)}</span>
                </div>
                <h3 className="line-clamp-2 min-h-10 font-bold text-slate-800">{course.title}</h3>
                <p className="text-xs text-slate-500">{course.category} · {course.totalLessons} bài học</p>
                <button onClick={() => onSelectCourse(course)} className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-700">Quản lý khóa học</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
