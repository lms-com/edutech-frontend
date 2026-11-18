import React, { useCallback, useEffect, useState } from 'react';
import {
  CourseRevenueBreakdown,
  InstructorAnalyticsOverview,
  RevenueChartPoint,
} from '../../../types';
import instructorAnalyticsApi from '../../../api/instructorAnalyticsApi';
import { formatVND } from '../../../utils/format';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

interface StudioAnalyticsTabProps {
  onGoToPayouts: () => void;
}

export const StudioAnalyticsTab: React.FC<StudioAnalyticsTabProps> = ({ onGoToPayouts }) => {
  const [analyticsOverview, setAnalyticsOverview] = useState<InstructorAnalyticsOverview | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartPoint[]>([]);
  const [courseBreakdown, setCourseBreakdown] = useState<CourseRevenueBreakdown[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const [overview, chart, breakdown] = await Promise.all([
        instructorAnalyticsApi.getOverview(),
        instructorAnalyticsApi.getRevenueChart(),
        instructorAnalyticsApi.getCourseBreakdown(),
      ]);
      setAnalyticsOverview(overview);
      setRevenueChartData(chart);
      setCourseBreakdown(breakdown);
    } catch (err: any) {
      console.error('Lỗi nạp dữ liệu thống kê giảng viên:', err);
      setAnalyticsError(err?.message || 'Không thể tải số liệu phân tích doanh thu.');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalyticsData();
  }, [loadAnalyticsData]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#2c3e50] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Trung Tâm Phân Tích & Thống Kê Doanh Thu Giảng Viên
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tài chính, lượt học viên đăng ký và dòng tiền thực tế được đồng bộ trực tiếp từ Finance & Course Service.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAnalyticsData()}
            disabled={analyticsLoading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {analyticsError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{analyticsError}</span>
        </div>
      )}

      {analyticsLoading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-medium">Đang tổng hợp số liệu doanh thu và học viên từ máy chủ...</span>
        </div>
      ) : (
        <>
          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tổng học viên đã đăng ký</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#2c3e50]">
                {(analyticsOverview?.totalStudents ?? 0).toLocaleString()}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <span className="text-blue-600 font-bold">
                  +{analyticsOverview?.thisMonthSales ?? 0}
                </span>
                <span>lượt mua trong tháng này</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-2 relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                <span>Doanh thu tháng này</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-emerald-700">
                {formatVND(analyticsOverview?.thisMonthRevenue ?? 0)}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${
                  (analyticsOverview?.growthRate ?? 0) >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {(analyticsOverview?.growthRate ?? 0) >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-700" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-rose-700" />
                  )}
                  {(analyticsOverview?.growthRate ?? 0) >= 0 ? '+' : ''}
                  {analyticsOverview?.growthRate ?? 0}%
                </span>
                <span className="text-slate-400">so với tháng trước</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Số dư ví khả dụng</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#e74c3c]">
                {formatVND(analyticsOverview?.availableBalance ?? 0)}
              </h3>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Tạm khóa: {formatVND(analyticsOverview?.pendingBalance ?? 0)}</span>
                <button
                  type="button"
                  onClick={onGoToPayouts}
                  className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
                >
                  Rút tiền →
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tổng khóa học & Doanh thu</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#2c3e50]">
                {analyticsOverview?.totalCourses ?? 0} khóa học
              </h3>
              <div className="text-[11px] text-slate-500">
                Trọn đời: <strong className="text-slate-700 font-bold">{formatVND(analyticsOverview?.allTimeRevenue ?? 0)}</strong>
              </div>
            </div>
          </div>

          {/* REVENUE TREND CHART (6 MONTHS) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Biểu Đồ Xu Hướng Doanh Thu (6 Tháng Gần Nhất)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi số tiền thực nhận (hoa hồng sau khi trừ phí sàn) và tổng số lượt bán khóa học theo từng tháng.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                  Doanh thu thực nhận
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-indigo-200 inline-block"></span>
                  Tổng doanh số gộp
                </span>
              </div>
            </div>

            {revenueChartData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                Chưa có dữ liệu giao dịch phát sinh trong 6 tháng gần nhất.
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-6 gap-2 sm:gap-4 h-56 items-end pb-2 border-b border-slate-200">
                  {(() => {
                    const maxVal = Math.max(
                      ...revenueChartData.map(d => Math.max(d.grossSales, d.revenue)),
                      1000000
                    );
                    return revenueChartData.map((pt, idx) => {
                      const revPct = Math.min(100, Math.max(6, Math.round((pt.revenue / maxVal) * 100)));
                      const grossPct = Math.min(100, Math.max(8, Math.round((pt.grossSales / maxVal) * 100)));

                      return (
                        <div key={pt.period || idx} className="flex flex-col items-center h-full justify-end group relative">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 z-20 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap space-y-0.5">
                            <p className="font-bold text-amber-300">{pt.label}</p>
                            <p>Thực nhận: <strong>{formatVND(pt.revenue)}</strong></p>
                            <p className="text-slate-300">Doanh số: {formatVND(pt.grossSales)} ({pt.orderCount} đơn)</p>
                          </div>

                          <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full pb-1">
                            <div
                              style={{ height: `${grossPct}%` }}
                              className="w-3 sm:w-5 bg-indigo-100 group-hover:bg-indigo-200 rounded-t-md transition-all duration-500"
                              title={`Doanh số gộp: ${formatVND(pt.grossSales)}`}
                            />
                            <div
                              style={{ height: `${revPct}%` }}
                              className="w-4 sm:w-7 bg-emerald-600 group-hover:bg-emerald-500 rounded-t-md transition-all duration-500 shadow-xs relative"
                              title={`Thực nhận: ${formatVND(pt.revenue)}`}
                            >
                              {pt.revenue > 0 && (
                                <div className="hidden sm:block absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-800">
                                  {pt.orderCount > 0 ? `${pt.orderCount}đ` : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-slate-700 mt-2 block">
                            {pt.label}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Kỳ báo cáo</th>
                        <th className="p-3">Doanh thu thực nhận</th>
                        <th className="p-3">Tổng giá trị doanh số</th>
                        <th className="p-3 text-right">Lượt mua</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {revenueChartData.map(pt => (
                        <tr key={pt.period} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-900">{pt.label}</td>
                          <td className="p-3 font-bold text-emerald-700">{formatVND(pt.revenue)}</td>
                          <td className="p-3 text-slate-600">{formatVND(pt.grossSales)}</td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                              {pt.orderCount} đơn
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* DETAILED COURSE REVENUE BREAKDOWN TABLE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Thống Kê Doanh Thu Chi Tiết Từng Khóa Học
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Số liệu doanh thu gộp, tỷ lệ khấu trừ phí sàn (30%) và doanh thu thực nhận (70%) phân bổ cho từng khóa học.
              </p>
            </div>

            {courseBreakdown.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                Chưa có giao dịch phát sinh doanh thu cho các khóa học.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Khóa học</th>
                      <th className="p-3">Giá bán gốc</th>
                      <th className="p-3 text-center">Lượt bán</th>
                      <th className="p-3">Doanh thu gộp</th>
                      <th className="p-3">Phí sàn (30%)</th>
                      <th className="p-3 text-right">Thực nhận (70%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {courseBreakdown.map(item => (
                      <tr key={item.courseId} className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{item.courseTitle}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {item.courseId}</p>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{formatVND(item.basePrice)}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                            {item.salesCount} đơn
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{formatVND(item.grossRevenue)}</td>
                        <td className="p-3 text-rose-600 font-medium">-{formatVND(item.platformFee)}</td>
                        <td className="p-3 text-right font-black text-emerald-700 text-sm">{formatVND(item.netRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                    <tr>
                      <td className="p-3" colSpan={2}>Tổng cộng:</td>
                      <td className="p-3 text-center">{courseBreakdown.reduce((sum, i) => sum + i.salesCount, 0)} đơn</td>
                      <td className="p-3">{formatVND(courseBreakdown.reduce((sum, i) => sum + i.grossRevenue, 0))}</td>
                      <td className="p-3 text-rose-600">-{formatVND(courseBreakdown.reduce((sum, i) => sum + i.platformFee, 0))}</td>
                      <td className="p-3 text-right text-emerald-700 text-sm font-black">{formatVND(courseBreakdown.reduce((sum, i) => sum + i.netRevenue, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
