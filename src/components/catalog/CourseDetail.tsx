import React, { useState } from 'react';
import { Course } from '../../types';
import { MOCK_REVIEWS } from '../../data/mockData';
import { 
  Star, 
  Clock, 
  BookOpen, 
  Globe, 
  Calendar, 
  ShieldCheck, 
  Check, 
  PlayCircle, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Users, 
  Sparkles, 
  ArrowLeft,
  Lock
} from 'lucide-react';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onStartLearning: (course: Course) => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  onBack,
  onStartLearning
}) => {
  const [expandedSection, setExpandedSection] = useState<string>(course.sections[0]?.id || '');
  const [playingTrailer, setPlayingTrailer] = useState(false);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#2c3e50] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại Danh mục khóa học
      </button>

      {/* Hero Header Area (Dark Slate with Microservices Accent) */}
      <div className="bg-[#2c3e50] text-white p-6 md:p-10 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#e74c3c] text-white text-xs font-bold">
              {course.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
              {course.subcategory}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-300 text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Chuẩn HLS AES-128
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug">
            {course.title}
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
            {course.shortDescription}
          </p>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs text-slate-300 pt-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{course.rating}</span>
              <span className="text-slate-400 font-normal">({course.reviewsCount} đánh giá)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{course.instructor.totalStudents.toLocaleString()} học viên ghi danh</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Cập nhật gần nhất: {course.updatedAt}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Ngôn ngữ: {course.language}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (65% -> 8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* What you'll learn */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#2c3e50] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#e74c3c]" />
              Bạn sẽ học được gì trong khóa học này
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {course.whatYouWillLearn.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs md:text-sm text-slate-700 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Curriculum Accordion */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#2c3e50]">Giáo trình khóa học</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {course.sections.length} chương • {course.totalLessons} bài học • Thời lượng {course.durationHours} giờ
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400">
                GET /course-service/api/v1/courses/{course.id}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
              {course.sections.map((section, idx) => {
                const isOpen = expandedSection === section.id;
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => setExpandedSection(isOpen ? '' : section.id)}
                      className="w-full p-4 text-left bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        <span className="font-bold text-xs md:text-sm text-[#2c3e50]">
                          {section.title}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {section.lessons.length} bài học
                      </span>
                    </button>

                    {isOpen && (
                      <div className="p-4 bg-white space-y-2 divide-y divide-slate-100">
                        {section.lessons.map(lesson => (
                          <div key={lesson.id} className="pt-2 flex items-center justify-between text-xs text-slate-700">
                            <div className="flex items-center gap-2.5">
                              <PlayCircle className="w-4 h-4 text-[#e74c3c]" />
                              <span className="font-medium">{lesson.title}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {lesson.isPreview && (
                                <button
                                  onClick={() => setPlayingTrailer(true)}
                                  className="text-[10px] font-bold text-[#e74c3c] bg-[#e74c3c]/10 px-2 py-0.5 rounded hover:bg-[#e74c3c]/20"
                                >
                                  Xem trước
                                </button>
                              )}
                              <span className="font-mono text-slate-400">{lesson.durationMinutes} phút</span>
                            </div>
                          </div>
                        ))}

                        {section.quiz && (
                          <div className="pt-2 flex items-center justify-between text-xs text-amber-700 bg-amber-50/50 p-2 rounded">
                            <span className="font-bold">📝 {section.quiz.title}</span>
                            <span className="text-[11px] font-semibold">{section.quiz.questions.length} câu trắc nghiệm</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructor Profile */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#2c3e50]">Thông tin Giảng viên phụ trách</h2>
            <div className="flex items-start gap-4">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200 shadow-md"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[#2c3e50]">{course.instructor.name}</h3>
                <p className="text-xs text-[#e74c3c] font-semibold">{course.instructor.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">{course.instructor.bio}</p>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 font-medium">
                  <span>⭐ {course.instructor.rating} Điểm đánh giá</span>
                  <span>👨‍🎓 {course.instructor.totalStudents.toLocaleString()} Học viên</span>
                  <span>📚 {course.instructor.totalCourses} Khóa học</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2c3e50]">Đánh giá từ học viên</h2>
              <span className="text-xs text-slate-400 font-mono">
                GET /enrollment-service/api/v1/reviews/courses/{course.id}
              </span>
            </div>

            <div className="space-y-4">
              {MOCK_REVIEWS.map(rev => (
                <div key={rev.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={rev.userAvatar} alt={rev.userName} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-xs text-[#2c3e50]">{rev.userName}</p>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">{rev.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (35% -> 4 cols Sticky Pricing Card) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Trailer preview */}
            <div className="relative aspect-video bg-black group">
              <video
                src={course.trailerVideoUrl}
                poster={course.thumbnail}
                controls={playingTrailer}
                autoPlay={playingTrailer}
                className="w-full h-full object-cover"
              />
              {!playingTrailer && (
                <div 
                  onClick={() => setPlayingTrailer(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer hover:bg-black/30 transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-[#e74c3c] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8" />
                  </div>
                  <span className="absolute bottom-3 text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-full">
                    Xem Trailer giới thiệu
                  </span>
                </div>
              )}
            </div>

            {/* Pricing Details */}
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#e74c3c]">
                    {formatVND(course.discountPrice || course.price)}
                  </span>
                  {course.discountPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatVND(course.price)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-600 font-semibold">
                  Tiết kiệm {formatVND((course.price) - (course.discountPrice || course.price))} (Giảm 32%)
                </p>
              </div>

              {/* Primary CTA */}
              <button
                onClick={() => onStartLearning(course)}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-sm shadow-xl shadow-red-900/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                Đăng ký & Vào phòng học ngay
              </button>

              {/* Highlights Checklist */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{course.durationHours} giờ video theo yêu cầu (HLS AES-128)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>{course.totalLessons} bài học & file tài liệu MinIO đính kèm</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Cấp chứng chỉ tốt nghiệp xác thực mã QR SHA-256</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Cam kết bảo đảm chất lượng & truy cập trọn đời</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-center text-[11px] text-slate-500 font-mono">
                API GATEWAY • JWT ACCESS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
