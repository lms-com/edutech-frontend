import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/orderApi';
import type { OrderSummary } from '../../types';
import { formatVND } from '../../utils/format';
import { ShoppingBag, X, Calendar, CheckCircle2, Clock, XCircle, AlertCircle, Loader2, ChevronRight, BookOpen } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      loadOrders(0);
    } else {
      setSelectedOrder(null);
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

  if (!isOpen) return null;

  const renderStatusBadge = (status: OrderSummary['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán
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
                </div>
              ))}
            </div>
          )}
        </div>

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
