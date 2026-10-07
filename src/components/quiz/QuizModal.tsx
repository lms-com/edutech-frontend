import React, { useState, useEffect } from 'react';
import { Quiz } from '../../types';
import { Clock, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, ArrowLeft, Send, Award, RotateCcw, X, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import enrollmentApi, { type QuizAnswerPayload } from '../../api/enrollmentApi';

interface QuizModalProps {
  quiz: Quiz;
  /** Cần lượt ghi danh để server ghi nhận và chấm điểm bài làm. */
  enrollmentId: string | null;
  onClose: () => void;
  onQuizPassed: (score: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  quiz,
  enrollmentId,
  onClose,
  onQuizPassed
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.durationMinutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [hasPassed, setHasPassed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [questionDetails, setQuestionDetails] = useState<
    {
      questionId: string;
      questionText: string;
      selectedAnswerId?: string | null;
      correctAnswerIds: string[];
      isCorrect: boolean;
      explanation: string;
    }[]
  >([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đếm ngược chỉ chạy khi bài kiểm tra có thời lượng. Dữ liệu thật hiện không có
  // thời lượng, nếu không chặn thì timeLeft = 0 sẽ tự nộp bài sau 1 giây.
  const hasTimer = quiz.durationMinutes > 0;

  useEffect(() => {
    if (submitted || !hasTimer) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, hasTimer]);

  const currentQuestion = quiz.questions[currentIdx];

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (submitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: key
    }));
  };

  /**
   * Nộp bài: gửi các lựa chọn đã chọn, KHÔNG gửi điểm.
   * Điểm do backend chấm từ đáp án đúng nên không thể sửa từ phía client.
   */
  const handleSubmitQuiz = async () => {
    if (isSubmitting || submitted) return;

    if (!enrollmentId) {
      setSubmitError('Bạn cần ghi danh khóa học trước khi làm bài kiểm tra.');
      return;
    }
    if (quiz.questions.length === 0) {
      setSubmitError('Bài kiểm tra này chưa có câu hỏi.');
      return;
    }

    const answers: QuizAnswerPayload[] = quiz.questions
      .map(question => {
        const chosenKey = selectedAnswers[question.id];
        const option = question.options.find(item => item.key === chosenKey);
        return option?.answerId ? { questionId: question.id, answerId: option.answerId } : null;
      })
      .filter((item): item is QuizAnswerPayload => item !== null);

    if (answers.length === 0) {
      setSubmitError('Bạn chưa chọn đáp án cho câu nào.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await enrollmentApi.submitQuizAttempt(enrollmentId, quiz.id, answers);
      setScore(result.score);
      setHasPassed(result.isPassed);
      setFeedback(result.feedback ?? null);
      setQuestionDetails(result.details ?? []);
      setSubmitted(true);

      if (result.isPassed) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {
          // Bỏ qua nếu trình duyệt không hỗ trợ
        }
        onQuizPassed(result.score);
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Không nộp được bài kiểm tra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2c3e50] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e74c3c] flex items-center justify-center text-white">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{quiz.title}</h2>
              <p className="text-xs text-slate-300">
                Tiêu chuẩn qua bài: ≥ {quiz.passScore}% ({Math.ceil((quiz.passScore / 100) * quiz.questions.length)}/{quiz.questions.length} câu)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!submitted && hasTimer && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-amber-300 font-mono text-xs font-bold border border-slate-700">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                {formatTimer(timeLeft)}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!submitted ? (
          <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Center: Question and Options */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Câu hỏi {currentIdx + 1} / {quiz.questions.length}</span>
                <span className="text-emerald-700 font-semibold">
                  Đã trả lời: {answeredCount}/{quiz.questions.length}
                </span>
              </div>

              {/* Question Text */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-base md:text-lg font-bold text-[#2c3e50] leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map(option => {
                  const isSelected = selectedAnswers[currentQuestion.id] === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => handleSelectOption(option.key)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-[#e74c3c] bg-[#e74c3c]/5 text-[#2c3e50] shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected ? 'bg-[#e74c3c] text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {option.key}
                      </span>
                      <span className="text-sm font-medium pt-0.5 leading-snug">
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {submitError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Navigation Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Câu trước
                </button>

                <div className="flex items-center gap-3">
                  {currentIdx < quiz.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#2c3e50] text-white hover:bg-[#1a252f] transition-colors"
                    >
                      Câu tiếp theo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting || !enrollmentId || quiz.questions.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài Quiz'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Question Navigator Panel */}
            <div className="lg:col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider mb-3">
                  Danh sách câu hỏi
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {quiz.questions.map((q, idx) => {
                    const isAnswered = !!selectedAnswers[q.id];
                    const isCurrent = idx === currentIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                          isCurrent
                            ? 'ring-2 ring-[#e74c3c] bg-[#2c3e50] text-white'
                            : isAnswered
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-600"></span>
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#2c3e50] ring-1 ring-[#e74c3c]"></span>
                  <span>Đang chọn</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-white border border-slate-300"></span>
                  <span>Chưa trả lời</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Result Popup & Detailed Explanation Screen */
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
            <div className={`p-6 rounded-2xl text-center border ${
              hasPassed ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
            }`}>
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white mb-3 ${
                hasPassed ? 'bg-emerald-600' : 'bg-red-500'
              }`}>
                {hasPassed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <h3 className={`text-2xl font-black ${hasPassed ? 'text-emerald-900' : 'text-red-900'}`}>
                {hasPassed ? 'CHÚC MỪNG! BẠN ĐÃ ĐẠT BÀI QUIZ' : 'CHƯA ĐẠT YÊU CẦU ĐỖ'}
              </h3>
              <p className="text-sm mt-1 text-slate-600">
                Điểm số của bạn: <span className="text-2xl font-bold text-[#2c3e50]">{score}%</span> (Yêu cầu qua môn: {quiz.passScore}%)
              </p>
              {feedback && (
                <p className={`text-xs font-semibold mt-2 ${hasPassed ? 'text-emerald-700' : 'text-red-700'}`}>
                  {feedback}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#2c3e50] uppercase tracking-wider">
                Chi tiết kết quả & Giải thích đáp án:
              </h4>
              {quiz.questions.map((q, idx) => {
                const chosenKey = selectedAnswers[q.id];
                const chosenOption = q.options.find(option => option.key === chosenKey);
                const detail = questionDetails.find(d => d.questionId === q.id);
                const isQuestionCorrect = detail ? detail.isCorrect : false;
                const correctOptions = detail
                  ? q.options.filter(opt => opt.answerId && detail.correctAnswerIds.includes(opt.answerId))
                  : [];
                const explanationText = detail?.explanation || q.explanation;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border space-y-3 text-xs ${
                      detail
                        ? isQuestionCorrect
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-rose-200 bg-rose-50/40'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold text-slate-800 text-sm">
                        {idx + 1}. {q.question}
                      </span>
                      {detail && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] shrink-0 ${
                            isQuestionCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isQuestionCorrect ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Chính xác
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              Chưa chính xác
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-slate-700">
                      <div>
                        Đáp án bạn chọn:{' '}
                        <strong className={detail ? (isQuestionCorrect ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-800'}>
                          {chosenOption ? `${chosenOption.key}. ${chosenOption.text}` : 'Chưa chọn'}
                        </strong>
                      </div>

                      {detail && !isQuestionCorrect && correctOptions.length > 0 && (
                        <div>
                          Đáp án đúng:{' '}
                          <strong className="text-emerald-700">
                            {correctOptions.map(opt => `${opt.key}. ${opt.text}`).join(' | ')}
                          </strong>
                        </div>
                      )}
                    </div>

                    {explanationText && (
                      <div className="p-3 rounded-lg bg-white/90 border border-slate-200/80 text-slate-600 leading-relaxed">
                        <span className="font-bold text-[#2c3e50]">Giải thích: </span>
                        {explanationText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setSelectedAnswers({});
                  setQuestionDetails([]);
                  setTimeLeft(quiz.durationMinutes * 60);
                  setCurrentIdx(0);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Làm lại Quiz
              </button>

              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-[#2c3e50] hover:bg-[#1a252f] text-white transition-colors"
              >
                Trở lại phòng học
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
