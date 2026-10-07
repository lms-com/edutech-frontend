import React, { useEffect, useState } from 'react';
import type { Course, ReviewItem } from '../../types';
import orderApi from '../../api/orderApi';
import enrollmentApi from '../../api/enrollmentApi';
import { CourseThumbnail } from '../common/CourseThumbnail';
import courseApi from '../../api/courseApi';
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
  onSelectRelatedCourse?: (course: Course) => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  isEnrolled = false,
  onBack,
  onStartLearning,
  onEnrollFreeCourse,
  onSelectRelatedCourse,
}) => {
  const [expandedSection, setExpandedSection] = useState<string>(course.sections[0]?.id || '');
  const [promoCode, setPromoCode] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isEnrollingFree, setIsEnrollingFree] = useState(false);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [ratingSummary, setRatingSummary] = useState<{
    averageRating: number;
    totalReviews: number;
    starDistribution: Record<number, number>;
  } | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [reviewStar, setReviewStar] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);

  // Ưu tiên lấy thống kê từ endpoint summary; nếu chưa có thì tính từ danh sách đánh giá
  const reviewsCount = ratingSummary ? ratingSummary.totalReviews : reviews.length;
  const rating = ratingSummary
    ? ratingSummary.averageRating
    : reviews.length > 0
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const starCounts: Record<number, number> = ratingSummary?.starDistribution ?? {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  useEffect(() => {
    let cancelled = false;
    const loadReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const [page, summary] = await Promise.all([
          enrollmentApi.getCourseReviews(course.id),
          enrollmentApi.getCourseRatingSummary(course.id).catch(() => null),
        ]);
        if (!cancelled) {
          setReviews(page.items);
          setRatingSummary(summary);
        }
      } catch (err: any) {
        if (!cancelled) setReviewsError(err?.message || 'Không tải được đánh giá của khóa học.');
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };
    void loadReviews();
    return () => { cancelled = true; };
  }, [course.id]);

  useEffect(() => {
    let cancelled = false;
    void courseApi.getRelatedCourses(course.id)
      .then(items => { if (!cancelled) setRelatedCourses(items); })
      .catch(err => console.warn('Không tải được khóa học liên quan:', err));
    return () => { cancelled = true; };
  }, [course.id]);

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isEnrolled || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    setReviewSubmitError(null);
    try {
      const review = await enrollmentApi.submitReview(course.id, {
        star: reviewStar,
        comment: reviewComment.trim(),
      });
      setReviews(current => [review, ...current.filter(item => item.id !== review.id)]);
      setReviewComment('');
      enrollmentApi.getCourseRatingSummary(course.id)
        .then(summary => setRatingSummary(summary))
        .catch(() => null);
    } catch (err: any) {
      setReviewSubmitError(err?.status === 403
        ? 'Bạn cần có quyền học đang hoạt động để gửi đánh giá.'
        : err?.message || 'Không gửi được đánh giá.');
    } finally {
      setReviewSubmitting(false);
    }
  };

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

          {relatedCourses.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#2c3e50]">Khóa học liên quan</h2>
                <p className="mt-1 text-xs text-slate-500">Gợi ý khóa học cùng danh mục</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedCourses.map(related => (
                  <article key={related.id} className="overflow-hidden rounded-xl border border-slate-200">
                    <CourseThumbnail src={related.thumbnail} alt={related.title} className="aspect-video w-full bg-slate-100 object-cover" />
                    <div className="space-y-2 p-3">
                      <h3 className="line-clamp-2 text-xs font-bold text-slate-800">{related.title}</h3>
                      <p className="text-xs font-semibold text-rose-600">{related.price > 0 ? formatVND(related.price) : 'Miễn phí'}</p>
                      {onSelectRelatedCourse && <button onClick={() => onSelectRelatedCourse(related)} className="text-xs font-bold text-indigo-700 hover:underline">Xem khóa học</button>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Reviews List */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#2c3e50]">Đánh giá từ học viên</h2>
              {reviewsCount > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Trung bình {rating}/5 từ {reviewsCount} đánh giá
                </p>
              )}
            </div>

            {reviewsCount > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200 items-center">
                <div className="text-center sm:border-r sm:border-slate-200 sm:pr-4 space-y-1">
                  <div className="text-4xl font-black text-[#2c3e50]">{rating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">{reviewsCount} lượt đánh giá</p>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = starCounts[star] ?? 0;
                    const percent = reviewsCount > 0 ? Math.round((count / reviewsCount) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2.5 text-xs">
                        <span className="w-11 font-semibold text-slate-700 flex items-center gap-1 shrink-0">
                          {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-[11px] text-slate-500 shrink-0">
                          {count} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isEnrolled ? (
              <form onSubmit={handleSubmitReview} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-700">Đánh giá khóa học</p>
                  <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Số sao đánh giá">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" role="radio" aria-checked={reviewStar === star}
                        aria-label={`${star} sao`} onClick={() => setReviewStar(star)}
                        className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <Star className={`h-5 w-5 ${star <= reviewStar ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea required maxLength={2000} value={reviewComment} onChange={event => setReviewComment(event.target.value)}
                  rows={3} placeholder="Chia sẻ trải nghiệm học của bạn..." className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs focus:border-indigo-400 focus:outline-none" />
                {reviewSubmitError && <p role="alert" className="text-xs text-rose-700">{reviewSubmitError}</p>}
                <button disabled={reviewSubmitting || !reviewComment.trim()} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                  {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Chỉ học viên đã ghi danh và kích hoạt khóa học mới có thể gửi đánh giá và nhận xét.
              </div>
            )}

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
