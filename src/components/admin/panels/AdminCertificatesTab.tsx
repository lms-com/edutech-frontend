import React, { useState } from 'react';
import type { Certificate } from '../../../types';
import notificationApi from '../../../api/notificationApi';
import {
  AlertTriangle,
  Award,
  Check,
  Copy,
  ExternalLink,
  FileCheck2,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';

export const AdminCertificatesTab: React.FC = () => {
  const [certSearchQuery, setCertSearchQuery] = useState('');
  const [certSearching, setCertSearching] = useState(false);
  const [certResult, setCertResult] = useState<Certificate | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleAuditCertificate = async (e?: React.FormEvent, customHash?: string) => {
    if (e) e.preventDefault();
    const query = (customHash ?? certSearchQuery).trim();
    if (!query) return;
    setCertSearching(true);
    setCertError(null);
    setCertResult(null);
    try {
      const found = await notificationApi.verifyCertificate(query);
      setCertResult(found);
      if (customHash) setCertSearchQuery(customHash);
    } catch (err: any) {
      setCertError(
        err?.code === 404 || err?.status === 404
          ? `Không tìm thấy chứng chỉ với mã băm "${query}". Có thể mã chứng chỉ không tồn tại hoặc đã bị chỉnh sửa bất hợp pháp!`
          : err?.message || 'Lỗi khi kết nối với Notification Service để tra cứu.'
      );
    } finally {
      setCertSearching(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="space-y-1">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          Trung Tâm Thẩm Định & Đối Soát Chứng Chỉ Điện Tử
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tra cứu và đối soát chữ ký số SHA-256 của toàn bộ chứng chỉ tốt nghiệp đã được cấp phát bởi hệ thống Notification Service. Hỗ trợ xác minh học vị và phát hiện chứng chỉ giả mạo.
        </p>
      </div>

      <form onSubmit={e => void handleAuditCertificate(e)} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          Nhập mã băm SHA-256 (qrCodeHash) hoặc mã chứng chỉ cần kiểm định:
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={certSearchQuery}
              onChange={e => setCertSearchQuery(e.target.value)}
              placeholder="Ví dụ: kiemthu-nodejs-2026 hoặc mã băm sha256..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={certSearching || !certSearchQuery.trim()}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {certSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Thẩm định chứng chỉ
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
          <span>Gợi ý mẫu kiểm thử có sẵn trong DB:</span>
          <button
            type="button"
            onClick={() => void handleAuditCertificate(undefined, 'kiemthu-nodejs-2026')}
            className="font-mono text-indigo-600 hover:underline bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 cursor-pointer font-bold"
          >
            kiemthu-nodejs-2026
          </button>
        </div>
      </form>

      {certError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>CẢNH BÁO: KẾT QUẢ THẨM ĐỊNH KHÔNG HỢP LỆ</span>
          </div>
          <p className="leading-relaxed pl-6">{certError}</p>
        </div>
      )}

      {certResult && (
        <div className="border border-emerald-200 bg-emerald-50/20 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase">
                    HỢP LỆ & ĐÃ ĐỐI SOÁT
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {certResult.id}</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Chứng chỉ hoàn thành khóa học chính thức
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/?verify=${encodeURIComponent(certResult.qrCodeHash)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Trang đối soát công khai
              </a>
              {certResult.pdfUrl && (
                <a
                  href={certResult.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Xem file PDF gốc
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thông tin Học viên</p>
              <div>
                <span className="text-slate-500">Họ và tên:</span>{' '}
                <strong className="text-slate-900 text-sm font-extrabold">{certResult.studentName || 'Học viên hệ thống'}</strong>
              </div>
              {certResult.studentEmail && (
                <div>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="font-mono text-slate-700">{certResult.studentEmail}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Xếp loại:</span>{' '}
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  {certResult.grade || 'XUẤT SẮC'}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thông tin Khóa học</p>
              <div>
                <span className="text-slate-500">Khóa học:</span>{' '}
                <strong className="text-slate-900">{certResult.courseTitle}</strong>
              </div>
              <div>
                <span className="text-slate-500">Giảng viên:</span>{' '}
                <span className="text-slate-700">{certResult.instructorName || 'Ban Đào tạo EduTech'}</span>
              </div>
              <div>
                <span className="text-slate-500">Ngày cấp:</span>{' '}
                <span className="text-slate-700">{certResult.issueDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Chữ ký số toàn vẹn (SHA-256 QR Hash)
              </span>
              <button
                type="button"
                onClick={() => handleCopyHash(certResult.qrCodeHash)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHash ? 'Đã chép mã' : 'Sao chép mã băm'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-emerald-300 bg-slate-950 p-2.5 rounded-lg break-all border border-slate-800">
              {certResult.qrCodeHash}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
        <p className="font-bold text-slate-800">Quy chuẩn cấp phát chứng chỉ số EduTech LMS:</p>
        <p className="leading-relaxed">
          Chứng chỉ chỉ được hệ thống tự động sinh ra khi học viên hoàn thành 100% tiến độ bài học và vượt qua điểm sàn bài Quiz. Toàn bộ chứng chỉ đều được Notification Service tính toán mã băm SHA-256 duy nhất gắn liền với ID học viên và khóa học để đảm bảo tính pháp lý khi quét mã QR.
        </p>
      </div>
    </div>
  );
};
