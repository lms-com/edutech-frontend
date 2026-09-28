import React, { useEffect, useState } from 'react';
import type { Course, ReviewItem } from '../../types';
import orderApi from '../../api/orderApi';
import enrollmentApi from '../../api/enrollmentApi';
import { CourseThumbnail } from '../common/CourseThumbnail';
import { formatVND, formatDuration } from '../../utils/format';
import { rememberPendingPurchase } from '../../utils/pendingPurchase';
import {
  Star,
  Clock,
  BookOpen,
  ShieldCheck,
  Check,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Award,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface CourseDetailProps {
  course: Course;
  isEnrolled?: boolean;
  onBack: () => void;
  onStartLearning: (course: Course) => void;
  onEnrollFreeCourse?: (course: Course) => Promise<void>;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  isEnrolled = false,
  onBack,
  onStartLearning,
  onEnrollFreeCourse,
}) => {
  const [expandedSection, setExpandedSection] = useState<string>(course.sections[0]?.id || '');
  const [promoCode, setPromoCode] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isEnrollingFree, setIsEnrollingFree] = useState(false);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Điểm đánh giá không có trong API khóa học nên tính từ danh sách đánh giá thật
  const reviewsCount = reviews.length;
  const rating = reviewsCount > 0
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount) * 10) / 10
    : 0;

  useEffect(() => {
    let cancelled = false;
    const loadReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const page = await enrollmentApi.getCourseReviews(course.id);
        if (!cancelled) setReviews(page.items);
      } catch (err: any) {
        if (!cancelled) setReviewsError(err?.message || 'Không tải được đánh giá của khóa học.');
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };
    void loadReviews();
    return () => { cancelled = true; };
  }, [course.id]);

  const handleCheckoutVNPay = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const response = await orderApi.createOrder({
        items: [
          {
            courseId: course.id,
            promotionCode: promoCode.trim() || undefined,
          },
        ],
        paymentMethod: 'VNPAY',
      });

      if (!response?.paymentUrl) {
        setCheckoutError('Máy chủ không trả về đường dẫn thanh toán.');
        return;
      }
      // Nhớ lại khóa học vì bước chuyển sang VNPay sẽ nạp lại toàn bộ trang
      rememberPendingPurchase(course.id);
      // Chuyển sang cổng VNPay sandbox để thanh toán thật
      window.location.href = response.paymentUrl;
    } catch (err: any) {
      setCheckoutError(err?.message || 'Không tạo được đơn hàng. Kiểm tra bạn đã đăng nhập chưa.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#2c3e50] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại Danh mục khóa học
      </button>

      {/* Hero Header Area */}
      <div className="bg-[#1e293b] text-white p-6 md:p-10 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {course.category && (
              <span className="px-3 py-1 rounded-full bg-[#e74c3c] text-white text-xs font-bold">
                {course.category}
              </span>
            )}
            {course.level && (
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                {course.level}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-300 text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Chứng chỉ Xác thực
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug">
            {course.title}
          </h1>

          {course.shortDescription && (
            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
              {course.shortDescription}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs text-slate-300 pt-2">
            {reviewsCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{rating}</span>
                <span className="text-slate-400 font-normal">({reviewsCount} đánh giá)</span>
              </div>
            )}
            {course.totalLessons > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>{course.totalLessons} bài học</span>
              </div>
            )}
            {course.durationHours > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{formatDuration(Math.round(course.durationHours * 60))} video</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Curriculum Accordion */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#2c3e50]">Giáo trình khóa học</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {course.sections.length} chương • {course.totalLessons} bài học
                {course.durationHours > 0 && <> • Thời lượng {formatDuration(Math.round(course.durationHours * 60))}</>}
              </p>
            </div>

            {course.sections.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Giáo trình của khóa học đang được cập nhật.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                {course.sections.map(section => {
                  const isOpen = expandedSection === section.id;
                  return (
                    <div key={section.id}>
                      <button
                        onClick={() => setExpandedSection(isOpen ? '' : section.id)}
                        className="w-full p-4 text-left bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
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
                                  <span className="text-[10px] font-bold text-[#e74c3c] bg-[#e74c3c]/10 px-2 py-0.5 rounded">
                                    Học thử
                                  </span>
                                )}
                                {lesson.durationMinutes > 0 && (
                                  <span className="font-mono text-slate-400">
                                    {formatDuration(lesson.durationMinutes)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}

                          {section.quiz && (
                            <div className="pt-2 flex items-center justify-between text-xs text-amber-700 bg-amber-50/50 p-2 rounded">
                              <span className="font-bold">📝 {section.quiz.title}</span>
                              <span className="text-[11px] font-semibold">
                                {section.quiz.questions.length > 0
                                  ? `${section.quiz.questions.length} câu trắc nghiệm`
                                  : 'Chưa có câu hỏi'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#2c3e50]">Đánh giá từ học viên</h2>
              {reviewsCount > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Trung bình {rating}/5 từ {reviewsCount} đánh giá
                </p>
              )}
            </div>

            {reviewsLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải đánh giá...
              </div>
            )}

            {!reviewsLoading && reviewsError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{reviewsError}</span>
              </div>
            )}

            {!reviewsLoading && !reviewsError && reviewsCount === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Khóa học chưa có đánh giá nào.
              </div>
            )}

            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#2c3e50] text-white flex items-center justify-center text-[11px] font-bold">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#2c3e50]">{review.userName}</p>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">{review.date}</span>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Pricing Card */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <CourseThumbnail
              src={course.thumbnail}
              alt={course.title}
              className="w-full aspect-video object-cover"
            />

            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-2xl font-black text-[#e74c3c]">
                  {course.price > 0 ? formatVND(course.price) : 'Miễn phí'}
                </span>
                <p className="text-xs text-slate-500">
                  {isEnrolled ? 'Bạn đã có quyền học khóa này.' : course.price > 0 ? 'Thanh toán một lần, truy cập trọn đời' : 'Ghi danh miễn phí để bắt đầu học.'}
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá..."
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#e74c3c]"
                />
              </div>

              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="space-y-2">
                {isEnrolled ? (
                  <button
                    onClick={() => onStartLearning(course)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlayCircle className="w-5 h-5 text-[#e74c3c]" />
                    <span>Tiếp tục học</span>
                  </button>
                ) : course.price > 0 ? (
                  <button
                    disabled={isCheckingOut}
                    onClick={handleCheckoutVNPay}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-sm shadow-xl shadow-red-900/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingOut ? <span>Đang tạo đơn hàng...</span> : <><ShieldCheck className="w-5 h-5" /><span>Đăng ký và thanh toán VNPay</span></>}
                  </button>
                ) : (
                  <button
                    disabled={isEnrollingFree || !onEnrollFreeCourse}
                    onClick={async () => {
                      if (!onEnrollFreeCourse) return;
                      setIsEnrollingFree(true);
                      setCheckoutError(null);
                      try { await onEnrollFreeCourse(course); }
                      catch (err: any) { setCheckoutError(err?.message || 'Không thể ghi danh khóa học.'); }
                      finally { setIsEnrollingFree(false); }
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isEnrollingFree ? 'Đang ghi danh...' : 'Ghi danh miễn phí'}
                  </button>
                )}
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                {course.totalLessons > 0 && (
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>{course.totalLessons} bài học</span>
                  </div>
                )}
                {course.durationHours > 0 && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{formatDuration(Math.round(course.durationHours * 60))} video bài giảng</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Cấp chứng chỉ tốt nghiệp xác thực mã QR</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Quyền truy cập học tập trọn đời</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
