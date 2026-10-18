import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/orderApi';
import type { OrderSummary } from '../../types';
import { formatVND } from '../../utils/format';
import { 
  ShoppingBag, 
  X, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  BookOpen,
  ShieldAlert,
  Send,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse?: (courseId: string) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectCourse,
}) => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);

  // Dispute & Refund Request Modal State
  const [disputeOrder, setDisputeOrder] = useState<OrderSummary | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('Nội dung khóa học không đúng mô tả');
  const [disputeDetail, setDisputeDetail] = useState<string>('');
  const [disputeSubmitting, setDisputeSubmitting] = useState<boolean>(false);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadOrders(0);
    } else {
      setSelectedOrder(null);
      setDisputeOrder(null);
      setDisputeSuccessMsg('');
    }
  }, [isOpen]);

  const loadOrders = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getMyOrders({ page, size: 5 });
      setOrders(res.items);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.page || 0);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải lịch sử đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const isWithin3Days = (rawDate?: string) => {
    if (!rawDate) return true;
    try {
      const created = new Date(rawDate).getTime();
      const now = Date.now();
      const diffDays = (now - created) / (1000 * 60 * 60 * 24);
      return diffDays <= 3;
    } catch {
      return true;
    }
  };

  const handleSendDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrder || !disputeDetail.trim()) return;

    setDisputeSubmitting(true);
    try {
      await orderApi.requestRefund(disputeOrder.id, {
        reason: disputeReason,
        detail: disputeDetail.trim(),
      });
      setDisputeSuccessMsg(`Yêu cầu khiếu nại hoàn tiền cho đơn hàng #${disputeOrder.id.slice(0, 8).toUpperCase()} đã được gửi đến Ban Quản Trị thẩm định theo chính sách 3 ngày.`);
      setDisputeOrder(null);
      setDisputeDetail('');
      loadOrders(currentPage);
    } catch (err: any) {
      alert(err?.message || 'Không thể gửi yêu cầu khiếu nại hoàn tiền.');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderStatusBadge = (status: OrderSummary['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán
          </span>
        );
      case 'REFUND_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> Đang khiếu nại hoàn tiền
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn tiền (3 ngày)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e74c3c]/10 text-[#e74c3c] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2c3e50]">Lịch sử đơn hàng</h2>
              <p className="text-xs text-slate-400">Các khóa học và hóa đơn bạn đã mua</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {disputeSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{disputeSuccessMsg}</span>
              </div>
              <button 
                onClick={() => setDisputeSuccessMsg('')}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#e74c3c]" />
              <p className="text-xs font-medium">Đang tải lịch sử giao dịch...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Chưa có đơn hàng nào</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bạn chưa thực hiện giao dịch mua khóa học nào. Hãy khám phá danh mục khóa học nhé!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition bg-white space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        {renderStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{order.createdAt}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-[#2c3e50]">
                        {formatVND(order.totalPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {order.items.length} khóa học
                      </div>
                    </div>
                  </div>

                  {/* Course items */}
                  <div className="space-y-2 pt-1">
                    {order.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="w-4 h-4 text-[#e74c3c] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">
                            {item.courseName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            {item.discountAmount > 0 && (
                              <span className="text-[10px] text-slate-400 line-through mr-1.5">
                                {formatVND(item.originalPrice)}
                              </span>
                            )}
                            <span className="font-bold text-slate-700">
                              {formatVND(item.finalPrice)}
                            </span>
                          </div>

                          {onSelectCourse && item.courseId && (
                            <button
                              onClick={() => {
                                onClose();
                                onSelectCourse(item.courseId);
                              }}
                              title="Xem khóa học"
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Bar & Dispute Trigger for Paid orders */}
                  {order.status === 'PAID' && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bảo vệ hoàn tiền trong 3 ngày</span>
                      </div>
                      {isWithin3Days(order.rawCreatedAt) ? (
                        <button
                          type="button"
                          onClick={() => setDisputeOrder(order)}
                          className="text-amber-700 hover:text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <HelpCircle className="w-3 h-3" />
                          Khiếu nại / Yêu cầu hoàn tiền (3 ngày)
                        </button>
                      ) : (
                        <span className="text-slate-400 italic flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Hết hạn hoàn tiền (sau 3 ngày)
                        </span>
                      )}
                    </div>
                  )}

                  {order.status === 'REFUND_REQUESTED' && (
                    <div className="flex items-center justify-between pt-2 border-t border-amber-200 text-[11px] text-amber-700 font-semibold bg-amber-50/70 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>Yêu cầu khiếu nại đang được Ban Quản Trị đối soát và thẩm định theo chính sách 3 ngày.</span>
                      </div>
                    </div>
                  )}

                  {order.status === 'REFUNDED' && (
                    <div className="flex items-center justify-between pt-2 border-t border-purple-200 text-[11px] text-purple-700 font-semibold bg-purple-50/70 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Đơn hàng đã được duyệt hoàn tiền. Quyền truy cập khóa học đã được thu hồi.</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Khiếu nại & Yêu cầu hoàn tiền */}
        {disputeOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-[#2c3e50] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Khiếu Nại Đơn Hàng #{disputeOrder.id.slice(0, 8).toUpperCase()}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">Yêu cầu hoàn tiền và bảo vệ quyền lợi học viên</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDisputeOrder(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendDispute} className="p-6 space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Chính sách bảo vệ 3 ngày:</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Đơn hàng trị giá <strong>{formatVND(disputeOrder.totalPrice)}</strong> đang trong thời gian giữ tiền an toàn. Ban Quản Trị sẽ tạm khóa giải ngân cho giảng viên và đối soát trong vòng 24h.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Lý do khiếu nại <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  >
                    <option value="Nội dung khóa học không đúng mô tả">Nội dung khóa học không đúng mô tả</option>
                    <option value="Video bài giảng bị lỗi hoặc không xem được">Video bài giảng bị lỗi hoặc không xem được</option>
                    <option value="Giảng viên không phản hồi câu hỏi hỗ trợ">Giảng viên không phản hồi câu hỏi hỗ trợ</option>
                    <option value="Tôi vô tình mua nhầm khóa học này">Tôi vô tình mua nhầm khóa học này</option>
                    <option value="Lý do khác">Lý do khác</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mô tả chi tiết vấn đề bạn gặp phải <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={disputeDetail}
                    onChange={e => setDisputeDetail(e.target.value)}
                    placeholder="Mô tả cụ thể bài giảng bị lỗi, nội dung chưa đạt hoặc lý do bạn mong muốn hoàn tiền..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDisputeOrder(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={disputeSubmitting || !disputeDetail.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-bold text-white transition shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    {disputeSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Gửi Khiếu Nại
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer & Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/60 text-xs">
            <span className="text-slate-400">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 0 || loading}
                onClick={() => loadOrders(currentPage - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 font-semibold cursor-pointer"
              >
                Trước
              </button>
              <button
                disabled={currentPage >= totalPages - 1 || loading}
                onClick={() => loadOrders(currentPage + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 font-semibold cursor-pointer"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
