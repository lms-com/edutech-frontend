import React, { useCallback, useEffect, useState } from 'react';
import instructorApplicationApi, { type InstructorApplicationDto } from '../../../api/instructorApplicationApi';
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Video,
  XCircle,
} from 'lucide-react';

interface AdminInstructorAppsTabProps {
  onSuccess: (msg: string) => void;
  onPendingCountChange: (count: number) => void;
}

export const AdminInstructorAppsTab: React.FC<AdminInstructorAppsTabProps> = ({
  onSuccess,
  onPendingCountChange,
}) => {
  const [applicationsList, setApplicationsList] = useState<InstructorApplicationDto[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [applicationFilterStatus, setApplicationFilterStatus] = useState<string>('PENDING');
  const [reviewingApp, setReviewingApp] = useState<InstructorApplicationDto | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewRejectReason, setReviewRejectReason] = useState('');
  const [reviewCommissionRate, setReviewCommissionRate] = useState<number>(0.7);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadApplications = useCallback(async (status?: string) => {
    setApplicationsLoading(true);
    setApplicationsError(null);
    try {
      const page = await instructorApplicationApi.getApplicationsForAdmin(status, 0, 50);
      const list = page.content || [];
      setApplicationsList(list);
      onPendingCountChange(list.filter(a => a.status === 'PENDING').length);
    } catch (err: any) {
      setApplicationsError(err?.message || 'Không tải được danh sách đơn giảng viên.');
      setApplicationsList([]);
    } finally {
      setApplicationsLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    void loadApplications(applicationFilterStatus);
  }, [applicationFilterStatus, loadApplications]);

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              Hàng Chờ Xét Duyệt Giảng Viên
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Xem xét hồ sơ chuyên môn, cấp quyền INSTRUCTOR và phân bổ tỷ lệ chia sẻ doanh thu cho giảng viên mới.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(st => (
              <button
                key={st}
                onClick={() => {
                  setApplicationFilterStatus(st);
                  void loadApplications(st);
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  applicationFilterStatus === st
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'PENDING' ? 'Chờ duyệt' : st === 'APPROVED' ? 'Đã duyệt' : st === 'REJECTED' ? 'Từ chối' : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {applicationsError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{applicationsError}</span>
          </div>
        )}

        {applicationsLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Đang tải danh sách đơn đăng ký giảng viên...</span>
          </div>
        ) : applicationsList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700">Không có đơn đăng ký nào trong danh mục này</p>
            <p className="text-slate-400">Tất cả các hồ sơ đã được xử lý xong.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
            {applicationsList.map(app => (
              <div key={app.id} className="p-5 hover:bg-slate-50/60 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{app.applicantName}</span>
                      <span className="text-xs text-slate-400 font-mono">({app.applicantEmail})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        app.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status === 'APPROVED' ? 'Đã duyệt' : app.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                      Chuyên môn: {app.expertise} • {app.experienceYears} năm kinh nghiệm
                    </p>
                  </div>

                  {app.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setReviewingApp(app);
                          setReviewAction('approve');
                          setReviewCommissionRate(0.7);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Duyệt giảng viên</span>
                      </button>
                      <button
                        onClick={() => {
                          setReviewingApp(app);
                          setReviewAction('reject');
                          setReviewRejectReason('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed italic">
                  "{app.bio}"
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                  {app.portfolioUrl && (
                    <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline font-medium">
                      <ExternalLink className="w-3 h-3" />
                      <span>Portfolio / LinkedIn</span>
                    </a>
                  )}
                  {app.cvUrl && (
                    <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline font-medium">
                      <FileText className="w-3 h-3" />
                      <span>CV / Hồ sơ đính kèm</span>
                    </a>
                  )}
                  <span className="text-slate-400">
                    Nộp lúc: {new Date(app.createdAt).toLocaleString('vi-VN')}
                  </span>
                  {app.rejectionReason && (
                    <span className="text-rose-600 font-semibold">
                      Lý do từ chối: {app.rejectionReason}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className={`p-5 text-white flex items-center justify-between ${
              reviewAction === 'approve' ? 'bg-gradient-to-r from-emerald-800 to-teal-900' : 'bg-gradient-to-r from-rose-800 to-red-950'
            }`}>
              <div className="flex items-center gap-2.5">
                {reviewAction === 'approve' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                <h3 className="font-bold text-sm">
                  {reviewAction === 'approve' ? 'Phê Duyệt Đơn Giảng Viên' : 'Từ Chối Đơn Giảng Viên'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingApp(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setReviewSubmitting(true);
                setApplicationsError(null);
                try {
                  await instructorApplicationApi.reviewApplication(reviewingApp.id, {
                    approved: reviewAction === 'approve',
                    rejectionReason: reviewAction === 'reject' ? reviewRejectReason.trim() : undefined,
                    defaultCommissionRate: reviewAction === 'approve' ? Number(reviewCommissionRate) || 0.7 : undefined,
                  });
                  onSuccess(reviewAction === 'approve'
                    ? `Đã phê duyệt và cấp quyền INSTRUCTOR cho ${reviewingApp.applicantName} thành công.`
                    : `Đã từ chối đơn của ${reviewingApp.applicantName}.`);
                  setReviewingApp(null);
                  await loadApplications(applicationFilterStatus);
                } catch (err: any) {
                  setApplicationsError(err?.message || 'Không thể xử lý đơn đăng ký.');
                } finally {
                  setReviewSubmitting(false);
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">{reviewingApp.applicantName} ({reviewingApp.applicantEmail})</p>
                <p className="text-slate-600">Chuyên môn: {reviewingApp.expertise} • {reviewingApp.experienceYears} năm kinh nghiệm</p>
              </div>

              {reviewAction === 'approve' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tỷ lệ chia sẻ doanh thu cho Giảng viên (mặc định 0.70 = 70%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1.0"
                    value={reviewCommissionRate}
                    onChange={e => setReviewCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hệ thống sẽ tự động gán role INSTRUCTOR, tạo hồ sơ instructor_profiles và kích hoạt ví doanh thu.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lý do từ chối đơn <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reviewRejectReason}
                    onChange={e => setReviewRejectReason(e.target.value)}
                    placeholder="Nêu rõ lý do từ chối để học viên bổ sung thông tin hoặc hồ sơ năng lực..."
                    className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingApp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer ${
                    reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {reviewSubmitting ? 'Đang xử lý...' : reviewAction === 'approve' ? 'Xác nhận Phê duyệt' : 'Xác nhận Từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
