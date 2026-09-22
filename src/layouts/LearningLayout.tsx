import React from 'react';
import { ArrowLeft, Award, Sparkles } from 'lucide-react';

interface LearningLayoutProps {
  courseTitle: string;
  progressPercent: number;
  onBack: () => void;
  onOpenCertificate: () => void;
  children: React.ReactNode;
}

export const LearningLayout: React.FC<LearningLayoutProps> = ({
  courseTitle,
  progressPercent,
  onBack,
  onOpenCertificate,
  children
}) => {
  const is100Percent = progressPercent >= 100;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans">
      {/* 1. Cinema Top Navigation Bar */}
      <header className="h-16 bg-[#1e293b]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            title="Quay lại danh mục khóa học"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Thoát phòng học</span>
          </button>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          <h1 className="text-sm font-semibold text-slate-200 truncate max-w-[200px] md:max-w-md">
            {courseTitle}
          </h1>
        </div>

        {/* Right: Progress % & Certificate Unlock */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <span>Tiến độ hoàn thành:</span>
              <span className="font-bold text-[#e74c3c] font-mono">{progressPercent}%</span>
            </div>
            <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-[#e74c3c] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={onOpenCertificate}
            disabled={!is100Percent}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
              is100Percent
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white cursor-pointer hover:scale-105 shadow-emerald-900/40'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
            title={is100Percent ? 'Xem và tải chứng chỉ số hoàn thành khóa học' : 'Hoàn thành 100% các bài học để nhận chứng chỉ'}
          >
            {is100Percent ? (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                <span>Nhận chứng chỉ tốt nghiệp</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4 text-slate-500" />
                <span>Nhận chứng chỉ ({progressPercent}%)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Cinema Learning Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default LearningLayout;
