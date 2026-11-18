import React, { useCallback, useEffect, useState } from 'react';
import type { RefundRequest } from '../../../types';
import orderApi from '../../../api/orderApi';
import axiosClient from '../../../api/axiosClient';
import { formatVND } from '../../../utils/format';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';

interface AdminRefundsTabProps {
  onSuccess: (msg: string) => void;
  onPendingCountChange: (count: number) => void;
}

export const AdminRefundsTab: React.FC<AdminRefundsTabProps> = ({
  onSuccess,
  onPendingCountChange,
}) => {
  const [refundList, setRefundList] = useState<RefundRequest[]>([]);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundFilterStatus, setRefundFilterStatus] = useState<string>('ALL');
  const [approvingRefund, setApprovingRefund] = useState<RefundRequest | null>(null);
  const [approveRefundNote, setApproveRefundNote] = useState('');
  const [approveRefundSubmitting, setApproveRefundSubmitting] = useState(false);
  const [rejectingRefund, setRejectingRefund] = useState<RefundRequest | null>(null);
  const [rejectRefundReason, setRejectRefundReason] = useState('');
  const [rejectRefundSubmitting, setRejectRefundSubmitting] = useState(false);
  const [learnerProgressMap, setLearnerProgressMap] = useState<Record<string, { rate: number; status: string } | null>>({});
  const [checkingProgressId, setCheckingProgressId] = useState<string | null>(null);

  const loadRefundRequests = useCallback(async (status?: string) => {
    setRefundLoading(true);
    setRefundError(null);
    try {
      const res = await orderApi.getAdminRefundRequests({
        page: 0,
        size: 50,
        status: status && status !== 'ALL' ? status : undefined,
      });
      const items = res.items || [];
      setRefundList(items);
      onPendingCountChange(items.filter(r => r.status === 'PENDING').length);
    } catch (err: any) {
      console.error('Lỗi tải danh sách khiếu nại hoàn tiền:', err);
      setRefundError(err?.message || 'Không tải được danh sách khiếu nại hoàn tiền.');
      setRefundList([]);
    } finally {
      setRefundLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    void loadRefundRequests(refundFilterStatus);
  }, [loadRefundRequests]);

  const handleCheckProgress = async (learnerId: string, courseId: string, itemKey: string) => {
    setCheckingProgressId(itemKey);
    try {
      const res: any = await axiosClient.get(`/enrollment-service/api/v1/enrollments/courses/${courseId}`, {
        params: { size: 100 },
      });
      const data = res?.data?.data || res?.data;
      const items: any[] = data?.content || data?.items || [];
      const enrollment = items.find((e: any) => e.learnerId === learnerId);
      if (enrollment) {
        setLearnerProgressMap(prev => ({
          ...prev,
          [itemKey]: {
            rate: enrollment.completedRate ?? 0,
            status: enrollment.status || 'ACTIVE',
          },
        }));
      } else {
        setLearnerProgressMap(prev => ({
          ...prev,
          [itemKey]: { rate: 0, status: 'NOT_FOUND' },
        }));
      }
    } catch (err) {
      console.error('Lỗi kiểm tra tiến độ:', err);
      setLearnerProgressMap(prev => ({
        ...prev,
        [itemKey]: { rate: 0, status: 'UNKNOWN' },
      }));
    } finally {
      setCheckingProgressId(null);
    }
  };

  const handleConfirmApproveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRefund) return;
    setApproveRefundSubmitting(true);
    try {
      await orderApi.approveRefund(approvingRefund.id, {
        note: approveRefundNote.trim() || undefined,
      });
      onSuccess(`Đã phê duyệt hoàn tiền cho đơn hàng #${approvingRefund.orderId.slice(0, 8).toUpperCase()}`);
      setApprovingRefund(null);
      setApproveRefundNote('');
      void loadRefundRequests(refundFilterStatus);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi duyệt hoàn tiền.');
    } finally {
      setApproveRefundSubmitting(false);
    }
  };

  const handleConfirmRejectRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRefund) return;
    if (!rejectRefundReason.trim()) {
      alert('Vui lòng nhập lý do từ chối hoàn tiền.');
      return;
    }
    setRejectRefundSubmitting(true);
    try {
      await orderApi.rejectRefund(rejectingRefund.id, {
        note: rejectRefundReason.trim(),
      });
      onSuccess(`Đã từ chối khiếu nại hoàn tiền cho đơn hàng #${rejectingRefund.orderId.slice(0, 8).toUpperCase()}`);
      setRejectingRefund(null);
      setRejectRefundReason('');
      void loadRefundRequests(refundFilterStatus);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi từ chối hoàn tiền.');
    } finally {
      setRejectRefundSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="font-bold text-base text-slate-900">
                Đối Soát Khiếu Nại & Xử Lý Hoàn Tiền (3 Ngày)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thẩm định yêu cầu hủy đơn & hoàn tiền của học viên. Admin có thể đối soát tiến độ học tập trước khi quyết định.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadRefundRequests(refundFilterStatus)}
              disabled={refundLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refundLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-xs">
          <span className="text-slate-400 font-medium mr-1">Bộ lọc trạng thái:</span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ xét duyệt' },
            { id: 'APPROVED', label: 'Đã hoàn tiền' },
            { id: 'REJECTED', label: 'Đã từ chối' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setRefundFilterStatus(f.id);
                void loadRefundRequests(f.id);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                refundFilterStatus === f.id
                  ? 'bg-[#2c3e50] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {refundError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{refundError}</span>
          </div>
        )}

        {refundLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Đang tải danh sách khiếu nại hoàn tiền...</p>
          </div>
        ) : refundList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span>Không có yêu cầu khiếu nại nào theo bộ lọc đã chọn.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {refundList.map(req => {
              const isPending = req.status === 'PENDING';
              const isApproved = req.status === 'APPROVED';
              const isRejected = req.status === 'REJECTED';

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all space-y-4 bg-slate-50/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            Đơn hàng #{req.orderId.slice(0, 8).toUpperCase()}
                          </span>
                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Chờ Admin duyệt
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Đã hoàn tiền
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Đã bác bỏ
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                          <span>Học viên ID: <code className="font-mono text-slate-600">{req.learnerId.slice(0, 12)}...</code></span>
                          <span>•</span>
                          <span>Gửi khiếu nại: {new Date(req.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-rose-600">
                        {formatVND(req.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Số tiền hoàn theo hóa đơn
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Lý do khiếu nại: <span className="text-[#2c3e50]">{req.reason}</span></span>
                    </div>
                    {req.detail && (
                      <p className="text-slate-600 text-xs pl-6 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                        "{req.detail}"
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">Khóa học trong đơn & Đối soát tiến độ:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(req.items || []).map(item => {
                        const itemKey = `${req.learnerId}_${item.courseId}`;
                        const progress = learnerProgressMap[itemKey];
                        const isChecking = checkingProgressId === itemKey;

                        return (
                          <div
                            key={item.courseId}
                            className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="font-semibold text-slate-800 truncate" title={item.courseName}>
                                  {item.courseName}
                                </span>
                              </div>
                              <span className="font-bold text-slate-700 shrink-0">
                                {formatVND(item.finalPrice)}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              {progress !== undefined && progress !== null ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-500">Tiến độ học:</span>
                                  <span className={`font-bold px-2 py-0.5 rounded-full ${
                                    progress.rate > 50
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {progress.rate}%
                                  </span>
                                  {progress.rate > 50 && (
                                    <span className="text-[10px] text-rose-600 italic">(&gt;50%: Cân nhắc từ chối)</span>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleCheckProgress(req.learnerId, item.courseId, itemKey)}
                                  disabled={isChecking}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <Search className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                                  {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra tiến độ học tập'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {req.adminNote && (
                    <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-800">Ghi chú thẩm định của Admin:</span>
                      <p className="text-slate-600 italic">{req.adminNote}</p>
                    </div>
                  )}

                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingRefund(req);
                          setRejectRefundReason('');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                      >
                        Từ chối hoàn tiền
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApprovingRefund(req);
                          setApproveRefundNote('Chấp thuận hoàn tiền theo chính sách bảo vệ học viên trong 3 ngày');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer"
                      >
                        Phê duyệt hoàn tiền
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {approvingRefund && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Phê Duyệt Hoàn Tiền Đơn Hàng</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thao tác này sẽ khấu trừ số tiền hoa hồng trong ví <strong>PENDING</strong> của giảng viên, chuyển đơn hàng sang trạng thái <strong>REFUNDED</strong> và thu hồi quyền học của học viên.
            </p>

            <form onSubmit={handleConfirmApproveRefund} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú thẩm định:
                </label>
                <textarea
                  value={approveRefundNote}
                  onChange={e => setApproveRefundNote(e.target.value)}
                  placeholder="Ghi chú xác nhận duyệt hoàn tiền..."
                  rows={3}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingRefund(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={approveRefundSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {approveRefundSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {approveRefundSubmitting ? 'Đang xử lý...' : 'Xác nhận Duyệt hoàn tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rejectingRefund && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Từ Chối Khiếu Nại Hoàn Tiền</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vui lòng nhập lý do từ chối cụ thể để gửi thông báo giải thích đến học viên (ví dụ: Tiến độ học tập đã đạt &gt;50%, không thỏa điều kiện chính sách).
            </p>

            <form onSubmit={handleConfirmRejectRefund} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do từ chối (Bắt buộc):
                </label>
                <textarea
                  value={rejectRefundReason}
                  onChange={e => setRejectRefundReason(e.target.value)}
                  placeholder="Ví dụ: Học viên đã hoàn thành hơn 60% chương trình học, không thuộc diện được hoàn phí..."
                  rows={3}
                  required
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRefund(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={rejectRefundSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {rejectRefundSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  {rejectRefundSubmitting ? 'Đang gửi...' : 'Xác nhận Từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
