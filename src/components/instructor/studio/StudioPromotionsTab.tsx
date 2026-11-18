import React, { useCallback, useEffect, useState } from 'react';
import promotionApi, { CreatePromotionPayload, PromotionDto } from '../../../api/promotionApi';
import { formatVND } from '../../../utils/format';
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  Unlink,
} from 'lucide-react';

interface StudioPromotionsTabProps {
  courseId: string;
  courseTitle: string;
  onSuccess: (msg: string) => void;
}

export const StudioPromotionsTab: React.FC<StudioPromotionsTabProps> = ({
  courseId,
  courseTitle,
  onSuccess,
}) => {
  const [promotionsList, setPromotionsList] = useState<PromotionDto[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promotionsError, setPromotionsError] = useState<string | null>(null);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [promoFormCode, setPromoFormCode] = useState('');
  const [promoDiscountType, setPromoDiscountType] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
  const [promoDiscountValue, setPromoDiscountValue] = useState('20');
  const [promoUsageLimit, setPromoUsageLimit] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoActionLoadingId, setPromoActionLoadingId] = useState<string | null>(null);

  const loadPromotions = useCallback(async () => {
    setPromotionsLoading(true);
    setPromotionsError(null);
    try {
      const page = await promotionApi.getMyPromotions({ page: 0, size: 50 });
      setPromotionsList(page.items);
    } catch (err: any) {
      console.error('Lỗi tải mã giảm giá:', err);
      setPromotionsError(err?.message || 'Không thể tải danh sách mã giảm giá.');
    } finally {
      setPromotionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPromotions();
  }, [loadPromotions]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoFormCode.trim()) {
      setPromotionsError('Vui lòng nhập mã giảm giá.');
      return;
    }
    setPromoSubmitting(true);
    setPromotionsError(null);
    try {
      const payload: CreatePromotionPayload = {
        code: promoFormCode.trim().toUpperCase(),
        discountPercent: promoDiscountType === 'PERCENT' ? Number(promoDiscountValue) : null,
        discountAmount: promoDiscountType === 'AMOUNT' ? Number(promoDiscountValue) : null,
        usageLimit: promoUsageLimit ? Number(promoUsageLimit) : null,
        endDate: promoEndDate ? `${promoEndDate}T23:59:59` : null,
      };
      const newPromo = await promotionApi.createPromotion(payload);
      await promotionApi.attachToCourse(newPromo.id, courseId);
      onSuccess(`Đã tạo mã giảm giá [${newPromo.code}] và áp dụng cho khóa học thành công!`);
      setIsCreatingPromo(false);
      setPromoFormCode('');
      setPromoDiscountValue('20');
      setPromoUsageLimit('');
      setPromoEndDate('');
      void loadPromotions();
    } catch (err: any) {
      setPromotionsError(err?.message || 'Không thể tạo mã giảm giá.');
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleToggleCourseAttach = async (promo: PromotionDto) => {
    const isAttached = (promo.appliedCourseIds || []).includes(courseId);
    setPromoActionLoadingId(promo.id);
    try {
      if (isAttached) {
        await promotionApi.detachFromCourse(promo.id, courseId);
        onSuccess(`Đã gỡ mã [${promo.code}] khỏi khóa học này.`);
      } else {
        await promotionApi.attachToCourse(promo.id, courseId);
        onSuccess(`Đã kích hoạt mã [${promo.code}] cho khóa học này!`);
      }
      void loadPromotions();
    } catch (err: any) {
      setPromotionsError(err?.message || 'Thao tác liên kết mã thất bại.');
    } finally {
      setPromoActionLoadingId(null);
    }
  };

  const handleDeletePromo = async (promoId: string, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mã giảm giá [${code}]?`)) return;
    setPromoActionLoadingId(promoId);
    try {
      await promotionApi.deletePromotion(promoId);
      onSuccess(`Đã xóa mã giảm giá [${code}].`);
      void loadPromotions();
    } catch (err: any) {
      setPromotionsError(err?.message || 'Không thể xóa mã giảm giá.');
    } finally {
      setPromoActionLoadingId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#e74c3c]" />
            <h3 className="text-base font-bold text-slate-800">Quản lý Mã Giảm Giá & Voucher</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tạo mã khuyến mãi độc quyền để thu hút học viên đăng ký khóa học của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadPromotions()}
            disabled={promotionsLoading}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${promotionsLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingPromo(!isCreatingPromo)}
            className="px-4 py-2 rounded-xl bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {isCreatingPromo ? 'Đóng biểu mẫu' : 'Tạo mã voucher mới'}
          </button>
        </div>
      </div>

      {promotionsError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{promotionsError}</span>
        </div>
      )}

      {isCreatingPromo && (
        <form onSubmit={handleCreatePromo} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông tin mã giảm giá mới</span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Sẽ tự động áp dụng cho: {courseTitle}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã code voucher <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: BANMOI30, TECH50"
                value={promoFormCode}
                onChange={e => setPromoFormCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hình thức giảm giá
              </label>
              <select
                value={promoDiscountType}
                onChange={e => setPromoDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
              >
                <option value="PERCENT">Giảm theo % (Phần trăm)</option>
                <option value="AMOUNT">Giảm số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {promoDiscountType === 'PERCENT' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={promoDiscountType === 'PERCENT' ? 1 : 1000}
                max={promoDiscountType === 'PERCENT' ? 100 : undefined}
                step={promoDiscountType === 'PERCENT' ? 1 : 10000}
                value={promoDiscountValue}
                onChange={e => setPromoDiscountValue(e.target.value)}
                placeholder={promoDiscountType === 'PERCENT' ? '20' : '100000'}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giới hạn số lượt dùng (để trống = vô hạn)
              </label>
              <input
                type="number"
                min="1"
                value={promoUsageLimit}
                onChange={e => setPromoUsageLimit(e.target.value)}
                placeholder="Không giới hạn"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày hết hạn (tùy chọn)
              </label>
              <input
                type="date"
                value={promoEndDate}
                onChange={e => setPromoEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreatingPromo(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={promoSubmitting}
              className="px-4 py-2 text-xs font-bold bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {promoSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {promoSubmitting ? 'Đang tạo...' : 'Lưu & Áp dụng ngay'}
            </button>
          </div>
        </form>
      )}

      {promotionsLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#e74c3c]" />
          <p className="text-xs">Đang tải danh sách voucher...</p>
        </div>
      ) : promotionsList.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl">
          <Tag className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-medium">Bạn chưa tạo mã giảm giá nào.</p>
          <p className="text-[11px] text-slate-400">Bấm "Tạo mã voucher mới" ở góc phải để bắt đầu chiến dịch khuyến mãi.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3.5">Mã Voucher</th>
                <th className="p-3.5">Mức giảm</th>
                <th className="p-3.5">Lượt sử dụng</th>
                <th className="p-3.5">Hạn dùng</th>
                <th className="p-3.5">Áp dụng cho khóa này</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promotionsList.map(promo => {
                const isAttached = (promo.appliedCourseIds || []).includes(courseId);
                const isLoading = promoActionLoadingId === promo.id;

                return (
                  <tr key={promo.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900 flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                        {promo.code}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-emerald-600">
                      {promo.discountPercent ? `Giảm ${promo.discountPercent}%` : formatVND(promo.discountAmount || 0)}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      <span className="font-bold">{promo.usageCount ?? 0}</span>
                      <span className="text-slate-400"> / {promo.usageLimit ? promo.usageLimit : '∞'}</span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {promo.endDate ? new Date(promo.endDate).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}
                    </td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => void handleToggleCourseAttach(promo)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                          isAttached
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isAttached ? (
                          <Link2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Unlink className="w-3 h-3 text-slate-400" />
                        )}
                        {isAttached ? 'Đang kích hoạt' : 'Chưa gắn (Bấm để bật)'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => void handleDeletePromo(promo.id, promo.code)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                        title="Xóa mã giảm giá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
