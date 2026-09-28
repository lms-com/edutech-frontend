import React, { useState } from 'react';
import type { Course } from '../../types';
import { 
  Search, 
  Star, 
  Clock, 
  BookOpen, 
  Award, 
  PlayCircle, 
  SlidersHorizontal,
  ShieldCheck
} from 'lucide-react';

interface CourseCatalogProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onEnterLearningRoom: (course: Course) => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({
  courses,
  onSelectCourse,
  onEnterLearningRoom
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState<'ALL' | 'PAID' | 'FREE'>('ALL');
  const [minRating, setMinRating] = useState<number>(0);

  const categories = [
    { id: 'ALL', name: 'Tất cả danh mục' },
    { id: 'Lập trình Backend', name: 'Lập trình Backend' },
    { id: 'DevOps & Cloud', name: 'DevOps & Cloud' },
    { id: 'Kiến trúc Hệ thống', name: 'Kiến trúc Hệ thống' }
  ];

  const filteredCourses = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchLevel = selectedLevel === 'ALL' || c.level === selectedLevel;
    const matchRating = c.rating >= minRating;
    const matchPrice = priceFilter === 'ALL' || (priceFilter === 'FREE' ? c.price === 0 : c.price > 0);
    return matchSearch && matchCat && matchLevel && matchRating && matchPrice;
  });

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

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

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onEnterLearningRoom(courses[0])}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs md:text-sm font-bold shadow-lg transition-all hover:scale-105 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              Khám phá khóa học tiêu biểu
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Award className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Search & Filter Header Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm khóa học, giảng viên, kỹ năng..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs md:text-sm focus:outline-none focus:border-[#2c3e50] focus:ring-1 focus:ring-[#2c3e50] bg-slate-50/50"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#2c3e50] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid with Filter Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter (Left 1 Col) */}
        <div className="space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-sm text-[#2c3e50] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#e74c3c]" />
              Bộ lọc nâng cao
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedLevel('ALL');
                setPriceFilter('ALL');
                setMinRating(0);
              }}
              className="text-[11px] text-[#e74c3c] hover:underline font-semibold cursor-pointer"
            >
              Đặt lại
            </button>
          </div>

          {/* Level Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Trình độ
            </label>
            <div className="space-y-1.5">
              {['ALL', 'Cơ bản', 'Trung cấp', 'Nâng cao'].map(lvl => (
                <label key={lvl} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="level"
                    checked={selectedLevel === lvl}
                    onChange={() => setSelectedLevel(lvl)}
                    className="accent-[#e74c3c]"
                  />
                  <span>{lvl === 'ALL' ? 'Tất cả trình độ' : lvl}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Filter */}
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
                    onChange={() => setPriceFilter(item.key as any)}
                    className="accent-[#e74c3c]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Đánh giá sao
            </label>
            <div className="space-y-1.5">
              {[
                { stars: 4.8, label: 'Từ 4.8 ⭐ trở lên' },
                { stars: 4.5, label: 'Từ 4.5 ⭐ trở lên' },
                { stars: 0, label: 'Tất cả đánh giá' }
              ].map(item => (
                <label key={item.stars} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === item.stars}
                    onChange={() => setMinRating(item.stars)}
                    className="accent-[#e74c3c]"
                  />
                  <span className="flex items-center gap-1">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Course Cards Grid (Right 3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tìm thấy <strong className="text-[#2c3e50]">{filteredCourses.length}</strong> khóa học phù hợp</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Thumbnail Container */}
                <div 
                  className="relative aspect-video overflow-hidden bg-slate-900 cursor-pointer" 
                  onClick={() => onSelectCourse(course)}
                >
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-[#2c3e50]/90 backdrop-blur-sm text-white text-[11px] font-bold">
                    {course.level}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.durationHours} giờ
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold text-[#e74c3c] uppercase tracking-wider">
                      {course.category}
                    </span>
                    <h3 
                      onClick={() => onSelectCourse(course)}
                      className="text-sm font-bold text-[#2c3e50] mt-1 leading-snug line-clamp-2 hover:text-[#e74c3c] cursor-pointer transition-colors"
                    >
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Giảng viên: <strong className="text-slate-700">{course.instructor.name}</strong>
                    </p>

                    {/* Stats bar */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{course.rating}</span>
                        <span className="text-slate-400 font-normal">({course.reviewsCount})</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-slate-500">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{course.totalLessons} bài</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {course.discountPrice ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#e74c3c]">
                            {formatVND(course.discountPrice)}
                          </span>
                          <span className="text-[11px] text-slate-400 line-through">
                            {formatVND(course.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-[#2c3e50]">
                          {formatVND(course.price)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEnterLearningRoom(course)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2c3e50] hover:bg-[#1a252f] text-white text-xs font-bold shadow-sm transition-all hover:scale-105 cursor-pointer"
                        title="Vào học ngay"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-[#e74c3c]" />
                        Học ngay
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
