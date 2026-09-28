import React, { useState, useEffect } from 'react';
import { Quiz } from '../../types';
import { Clock, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, ArrowLeft, Send, Award, RotateCcw, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizModalProps {
  quiz: Quiz;
  onClose: () => void;
  onQuizPassed: (score: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  quiz,
  onClose,
  onQuizPassed
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.durationMinutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [hasPassed, setHasPassed] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const currentQuestion = quiz.questions[currentIdx];

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (submitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: key
    }));
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    quiz.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = calculatedScore >= quiz.passScore;
    setScore(calculatedScore);
    setHasPassed(passed);
    setSubmitted(true);

    if (passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback
      }
      onQuizPassed(calculatedScore);
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
            {!submitted && (
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
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-md transition-all hover:scale-105"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Nộp bài Quiz
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
          /* Result Popup & Review Screen */
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
              {hasPassed && (
                <p className="text-xs text-emerald-700 font-semibold mt-2">
                  Tiến độ khóa học đã được cập nhật. Nếu bạn đã hoàn thành tất cả bài giảng, bạn có thể nhận Chứng chỉ ngay!
                </p>
              )}
            </div>

            {/* Answer Explanations */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#2c3e50] uppercase tracking-wider">
                Giải thích chi tiết từng câu hỏi:
              </h4>
              {quiz.questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-800 text-sm">
                        {idx + 1}. {q.question}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isCorrect ? 'Đúng' : 'Sai'}
                      </span>
                    </div>

                    <div className="text-slate-600">
                      Đáp án bạn chọn: <strong className="text-slate-800">{userAns || 'Chưa chọn'}</strong> | 
                      Đáp án đúng: <strong className="text-emerald-700 font-bold">{q.correctAnswer}</strong>
                    </div>

                    <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                      <strong className="text-slate-700 not-italic">Giải thích: </strong> {q.explanation}
                    </p>
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
