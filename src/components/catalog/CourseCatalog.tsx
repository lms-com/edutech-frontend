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
  Sparkles,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  TrendingUp,
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
    <div className="space-y-10 pb-16">
      {/* 1. HIGH-END CINEMATIC HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-[#0a1128] to-slate-900 text-white p-7 md:p-12 border border-slate-800 shadow-[0_20px_50px_rgba(15,23,42,0.3)]">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold border border-indigo-400/20 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Nền tảng Đào tạo Chuyên sâu Chuẩn Doanh Nghiệp 2026</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.15] text-white">
            Nâng tầm Kỹ năng Lập trình & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
              Kiến trúc Hệ thống Đám mây
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal max-w-2xl">
            Học tập qua video HLS phân giải thích ứng, thực hành dự án phân tán microservices thực tế, kiểm tra năng lực qua hệ thống chấm điểm tự động và nhận chứng chỉ số hóa xác thực QR.
          </p>

          {/* Quick Metrics Pillars */}
          <div className="pt-2 pb-1 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bảo mật AES-128 HLS</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Chứng chỉ số QR độc bản</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Giảng viên chuyên gia</span>
            </div>
          </div>

          {featuredCourse && (
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onSelectCourse(featuredCourse)}
                className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs md:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>Khám phá khóa học tiêu biểu</span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Ambient Decorative Graphic */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <GraduationCap className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* 2. KHÓA HỌC CỦA TÔI (MY ACTIVE ENROLLMENTS) */}
      {(enrollmentsLoading || myCourses.length > 0) && (
        <section className="space-y-4" aria-labelledby="my-courses-heading">
          <div className="flex items-end justify-between gap-3 pb-1 border-b border-slate-200/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 id="my-courses-heading" className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  Khóa học của tôi
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Tiếp tục hành trình học tập và hoàn thành chứng chỉ</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {myCourses.length} khóa đang học
            </span>
          </div>

          {enrollmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex gap-4 animate-pulse">
                  <div className="w-32 aspect-video bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-16 h-3 bg-slate-200 rounded" />
                    <div className="w-3/4 h-4 bg-slate-200 rounded" />
                    <div className="w-24 h-6 bg-slate-200 rounded-lg mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {myCourses.map(course => {
                const enrollment = activeEnrollments.find(item => item.courseId === course.id);
                const rate = enrollment?.completedRate ?? 0;
                return (
                  <article 
                    key={course.id} 
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 p-4 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-slate-900 relative">
                        <CourseThumbnail 
                          src={course.thumbnail} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đã kích hoạt
                        </span>
                        <h3 className="text-xs md:text-sm font-bold text-slate-900 mt-1 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Tiến độ học tập</span>
                        <span className="font-mono text-indigo-600">{rate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onEnterLearningRoom(course)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
                        <span>Tiếp tục học</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(course)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title="Xem trang giới thiệu khóa học"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. SEARCH & CATEGORIES FLOATING FILTER */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên khóa học hoặc nội dung..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs md:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryId === category.id
                  ? 'bg-slate-900 text-white shadow-sm'
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

      {/* 4. MAIN LAYOUT: SIDEBAR FILTER & COURSE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <aside className="space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              Bộ lọc nâng cao
            </span>
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Đặt lại
            </button>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Trình độ
            </label>
            <div className="space-y-2">
              {LEVEL_OPTIONS.map(level => (
                <label key={level} className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer hover:text-slate-900 font-medium">
                  <input
                    type="radio"
                    name="level"
                    checked={selectedLevel === level}
                    onChange={() => setSelectedLevel(level)}
                    className="accent-indigo-600 w-3.5 h-3.5"
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Mức giá
            </label>
            <div className="space-y-2">
              {[
                { key: 'ALL', label: 'Tất cả mức giá' },
                { key: 'PAID', label: 'Khóa có phí' },
                { key: 'FREE', label: 'Khóa miễn phí' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer hover:text-slate-900 font-medium">
                  <input
                    type="radio"
                    name="price"
                    checked={priceFilter === item.key}
                    onChange={() => setPriceFilter(item.key as 'ALL' | 'PAID' | 'FREE')}
                    className="accent-indigo-600 w-3.5 h-3.5"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Course Cards Grid */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>
              {loading
                ? 'Đang tải danh sách...'
                : <>Tìm thấy <strong className="text-slate-900">{catalogCourses.length}</strong> khóa học phù hợp</>}
            </span>
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
                  <div className="aspect-video bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="w-20 h-4 bg-slate-200 rounded-md" />
                    <div className="w-full h-5 bg-slate-200 rounded-md" />
                    <div className="w-3/4 h-3 bg-slate-100 rounded-md" />
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="w-24 h-5 bg-slate-200 rounded-md" />
                      <div className="w-16 h-4 bg-slate-200 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Không tải được danh sách khóa học</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử lại
                </button>
              )}
            </div>
          )}

          {!loading && !error && catalogCourses.length === 0 && (
            <div className="p-16 text-center text-sm text-slate-500 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">
                {courses.length === 0
                  ? 'Chưa có khóa học nào được xuất bản.'
                  : filteredCourses.length === 0
                    ? 'Không có khóa học nào khớp bộ lọc hiện tại.'
                  : 'Bạn đã ghi danh tất cả khóa học khớp bộ lọc.'}
              </p>
              {filteredCourses.length === 0 && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Xóa bộ lọc và xem tất cả khóa học
                </button>
              )}
            </div>
          )}

          {/* Double-Bezel High-End Course Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {catalogCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 overflow-hidden shadow-xs hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col group"
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
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold tracking-wide uppercase">
                      {course.level}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="w-10 h-10 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                      <PlayCircle className="w-6 h-6" />
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    {course.category && (
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                        {course.category}
                      </span>
                    )}
                    <h3
                      onClick={() => onSelectCourse(course)}
                      className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors pt-0.5"
                    >
                      {course.title}
                    </h3>
                    {course.shortDescription && (
                      <p className="text-xs text-slate-500 line-clamp-2 font-normal">
                        {course.shortDescription}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Học phí</span>
                      <span className="text-sm md:text-base font-black text-slate-900">
                        {course.price > 0 ? formatVND(course.price) : 'Miễn phí'}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectCourse(course)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer group/btn"
                    >
                      <span>Chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
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
