import React, { useEffect, useState } from 'react';
import type { Course } from '../../types';
import type { EnrollmentDto } from '../../api/enrollmentApi';
import courseApi, { type CategoryDto } from '../../api/courseApi';
import { CourseThumbnail } from '../common/CourseThumbnail';
import { formatVND } from '../../utils/format';
import {
  Search,
  BookOpen,
  PlayCircle,
  SlidersHorizontal,
  ShieldCheck,
  Award,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface CourseCatalogProps {
  courses: Course[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectCourse: (course: Course) => void;
  onEnterLearningRoom: (course: Course) => void;
  enrollments?: EnrollmentDto[];
  enrollmentsLoading?: boolean;
}

const LEVEL_OPTIONS = ['Tất cả trình độ', 'Cơ bản', 'Trung cấp', 'Nâng cao'];

export const CourseCatalog: React.FC<CourseCatalogProps> = ({
  courses,
  loading = false,
  error = null,
  onRetry,
  onSelectCourse,
  onEnterLearningRoom,
  enrollments = [],
  enrollmentsLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('Tất cả trình độ');
  const [priceFilter, setPriceFilter] = useState<'ALL' | 'PAID' | 'FREE'>('ALL');

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Danh mục lấy từ DB, không hardcode: seed thật là Lập trình / Thiết kế / Java / Web Development
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await courseApi.getCategories();
        if (!cancelled) setCategories(data);
      } catch (err: any) {
        if (!cancelled) setCategoriesError(err?.message || 'Không tải được danh mục.');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  /*
   * Lọc ở phía client vì `GET /courses` của backend chưa hỗ trợ tham số lọc.
   * Hệ quả cần biết: lọc client chỉ đúng khi lấy hết dữ liệu trong một lần gọi.
   * Khi dữ liệu lớn phải chuyển lọc xuống server, nếu không sẽ lọc sai vì chỉ
   * nhìn thấy trang hiện tại.
   */
  const activeEnrollments = enrollments.filter(item => item.status?.toUpperCase() === 'ACTIVE');
  const enrolledCourseIds = new Set(activeEnrollments.map(item => item.courseId));
  const myCourses = courses.filter(course => enrolledCourseIds.has(course.id));
  const filteredCourses = courses.filter(course => {
    const keyword = searchQuery.trim().toLowerCase();
    const matchSearch = keyword === '' ||
      course.title.toLowerCase().includes(keyword) ||
      course.shortDescription.toLowerCase().includes(keyword);
    const matchCategory = selectedCategoryId === 'ALL' || course.categoryId === selectedCategoryId;
    const matchLevel = selectedLevel === LEVEL_OPTIONS[0] || course.level === selectedLevel;
    const matchPrice = priceFilter === 'ALL' ||
      (priceFilter === 'FREE' ? course.price === 0 : course.price > 0);
    return matchSearch && matchCategory && matchLevel && matchPrice;
  });
  const catalogCourses = filteredCourses.filter(course => !enrolledCourseIds.has(course.id));

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId('ALL');
    setSelectedLevel(LEVEL_OPTIONS[0]);
    setPriceFilter('ALL');
  };

  const featuredCourse = courses.find(course => !enrolledCourseIds.has(course.id)) ?? courses[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1e293b] via-[#0f172a] to-[#1e293b] text-white rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
            Nền tảng Đào tạo Chuyên sâu Chuẩn Doanh Nghiệp
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Nâng tầm Kỹ năng Lập trình & Kiến trúc Hệ thống
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Học tập qua video bài giảng chất lượng cao, thực hành các dự án kiến trúc phân tán thực tế, làm bài kiểm tra đánh giá năng lực và nhận chứng chỉ số hóa chính quy.
          </p>

          {featuredCourse && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onSelectCourse(featuredCourse)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs md:text-sm font-bold shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                Khám phá khóa học tiêu biểu
              </button>
            </div>
          )}
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Award className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Học viên chỉ thấy quyền học trong mục này sau khi ghi danh ACTIVE. */}
      {(enrollmentsLoading || myCourses.length > 0) && (
        <section className="space-y-4" aria-labelledby="my-courses-heading">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="my-courses-heading" className="text-xl font-extrabold text-[#2c3e50]">Khóa học của tôi</h2>
              <p className="text-xs text-slate-500 mt-1">Khóa học đã được kích hoạt quyền học</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{myCourses.length} khóa học</span>
          </div>
          {enrollmentsLoading ? (
            <div className="flex items-center gap-2 p-5 bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải quyền học...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {myCourses.map(course => {
                const enrollment = activeEnrollments.find(item => item.courseId === course.id);
                return (
                  <article key={course.id} className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-sm flex flex-col sm:flex-row">
                    <CourseThumbnail src={course.thumbnail} alt={course.title} className="w-full sm:w-36 aspect-video sm:aspect-auto object-cover bg-slate-100" />
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Đã kích hoạt</span>
                        <h3 className="text-sm font-bold text-[#2c3e50] mt-1 line-clamp-2">{course.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Tiến độ: {enrollment?.completedRate ?? 0}%</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onEnterLearningRoom(course)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#2c3e50] hover:bg-[#1a252f] text-white text-xs font-bold cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4 text-[#e74c3c]" /> Tiếp tục học
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(course)}
                        className="text-left text-[11px] font-semibold text-indigo-700 hover:underline"
                      >
                        Chi tiết khóa học và đánh giá
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Search & Filter Header Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm khóa học theo tên hoặc mô tả..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs md:text-sm focus:outline-none focus:border-[#2c3e50] focus:ring-1 focus:ring-[#2c3e50] bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === 'ALL'
                ? 'bg-[#2c3e50] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryId === category.id
                  ? 'bg-[#2c3e50] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {categoriesError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{categoriesError} — bộ lọc danh mục tạm thời không dùng được.</span>
        </div>
      )}

      {/* Main Grid with Filter Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter */}
        <div className="space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-sm text-[#2c3e50] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#e74c3c]" />
              Bộ lọc
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] text-[#e74c3c] hover:underline font-semibold cursor-pointer"
            >
              Đặt lại
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Trình độ
            </label>
            <div className="space-y-1.5">
              {LEVEL_OPTIONS.map(level => (
                <label key={level} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="level"
                    checked={selectedLevel === level}
                    onChange={() => setSelectedLevel(level)}
                    className="accent-[#e74c3c]"
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Mức giá
            </label>
            <div className="space-y-1.5">
              {[
                { key: 'ALL', label: 'Tất cả mức giá' },
                { key: 'PAID', label: 'Khóa có phí' },
                { key: 'FREE', label: 'Khóa miễn phí' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="price"
                    checked={priceFilter === item.key}
                    onChange={() => setPriceFilter(item.key as 'ALL' | 'PAID' | 'FREE')}
                    className="accent-[#e74c3c]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              {loading
                ? 'Đang tải khóa học...'
                : <>Tìm thấy <strong className="text-[#2c3e50]">{catalogCourses.length}</strong> khóa học phù hợp</>}
            </span>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải danh sách khóa học...
            </div>
          )}

          {!loading && error && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Không tải được danh sách khóa học</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử lại
                </button>
              )}
            </div>
          )}

          {!loading && !error && catalogCourses.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
              {courses.length === 0
                ? 'Chưa có khóa học nào được xuất bản.'
                : filteredCourses.length === 0
                  ? 'Không có khóa học nào khớp bộ lọc hiện tại.'
                : 'Bạn đã ghi danh tất cả khóa học khớp bộ lọc.'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {catalogCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                <div
                  className="relative aspect-video overflow-hidden bg-slate-900 cursor-pointer"
                  onClick={() => onSelectCourse(course)}
                >
                  <CourseThumbnail
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {course.level && (
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-[#2c3e50]/90 backdrop-blur-sm text-white text-[11px] font-bold">
                      {course.level}
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {course.category && (
                      <span className="text-[11px] font-semibold text-[#e74c3c] uppercase tracking-wider">
                        {course.category}
                      </span>
                    )}
                    <h3
                      onClick={() => onSelectCourse(course)}
                      className="text-sm font-bold text-[#2c3e50] mt-1 leading-snug line-clamp-2 hover:text-[#e74c3c] cursor-pointer transition-colors"
                    >
                      {course.title}
                    </h3>
                    {course.shortDescription && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                        {course.shortDescription}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black text-[#2c3e50]">
                      {course.price > 0 ? formatVND(course.price) : 'Miễn phí'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectCourse(course)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        title="Xem chi tiết khóa học"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCatalog;
