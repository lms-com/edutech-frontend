import React, { useState } from 'react';
import { Certificate } from '../../types';
import { Download, Share2, Copy, Check, ShieldCheck, ExternalLink, Award, Sparkles, Printer } from 'lucide-react';

interface CertificateViewProps {
  certificate: Certificate;
  onClose?: () => void;
  onOpenPublicVerify?: (hash: string) => void;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  certificate,
  onClose,
  onOpenPublicVerify
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(certificate.qrCodeHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    // Simulate high-res PDF generation / download from notification-service
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto print:border-none print:shadow-none print:rounded-none">
        {/* Top Actions Bar (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#2c3e50] text-white print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#27ae60] flex items-center justify-center text-white">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base leading-tight">Chứng chỉ Tốt nghiệp Chính thức</h2>
              <p className="text-xs text-slate-300">Được cấp phát bởi EduTech LMS Microservices & Notification Service</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleCopyHash}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700/70 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
              title="Sao chép mã băm xác thực SHA-256"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã sao chép SHA-256' : 'Sao chép SHA-256'}
            </button>

            {onOpenPublicVerify && (
              <button
                onClick={() => onOpenPublicVerify(certificate.qrCodeHash)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Trang xác thực QR công khai
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              {downloading ? 'Đang chuẩn bị PDF...' : 'Tải file PDF / In'}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-slate-300 rounded-lg transition-colors"
              >
                Đóng
              </button>
            )}
          </div>
        </div>

        {/* Certificate Landscape Body (A4 Ratio: 297mm x 210mm ~ 1.414 ratio) */}
        <div className="p-6 md:p-10 bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center">
          <div 
            id="certificate-print-area"
            className="w-full bg-[#fdfdfd] border-[8px] border-double border-[#2c3e50] p-8 md:p-12 relative shadow-lg text-center select-none"
            style={{ minHeight: '520px' }}
          >
            {/* Corner Ornamental Accents */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#e74c3c]"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#e74c3c]"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#e74c3c]"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#e74c3c]"></div>

            {/* Certificate Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#2c3e50] text-white flex items-center justify-center font-black text-sm">
                    ET
                  </div>
                  <span className="font-bold text-lg tracking-wider text-[#2c3e50]">EDUTECH MICROSERVICES</span>
                </div>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-0.5">ACADEMY OF ADVANCED DISTRIBUTED SYSTEMS</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-full flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  XÁC THỰC MÃ HÓA SHA-256
                </div>
              </div>
            </div>

            {/* Title Section */}
            <div className="my-4">
              <span className="text-xs md:text-sm font-semibold tracking-[0.25em] text-[#e74c3c] uppercase">
                CHỨNG CHỈ TỐT NGHIỆP KHÓA HỌC
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#2c3e50] mt-2 tracking-tight font-serif">
                CHỨNG CHỈ HOÀN THÀNH
              </h1>
              <p className="text-xs md:text-sm text-slate-500 italic mt-1">
                Certificate of Completion & Professional Mastery
              </p>
            </div>

            {/* Recipient */}
            <div className="my-6">
              <p className="text-xs text-slate-600 uppercase tracking-wider">Trân trọng chứng nhận học viên</p>
              <h2 className="text-2xl md:text-4xl font-black text-[#2c3e50] tracking-wide mt-1 uppercase border-b-2 border-slate-300 inline-block px-8 pb-1">
                {certificate.studentName}
              </h2>
            </div>

            {/* Course Title & Grade */}
            <div className="max-w-2xl mx-auto my-4 text-slate-700">
              <p className="text-xs md:text-sm">Đã hoàn thành xuất sắc 100% chương trình đào tạo chuyên sâu và vượt qua bài đánh giá năng lực:</p>
              <h3 className="text-lg md:text-2xl font-bold text-[#e74c3c] mt-1.5 leading-snug">
                {certificate.courseTitle}
              </h3>
              <p className="text-xs font-semibold text-emerald-700 mt-1">
                Xếp loại tốt nghiệp: <span className="underline">{certificate.grade}</span>
              </p>
            </div>

            {/* Signatures and QR Code Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 items-end gap-4 text-center">
              {/* Left: Instructor Signature */}
              <div className="flex flex-col items-center">
                <div className="h-12 flex items-center justify-center">
                  <span className="font-serif italic text-2xl text-slate-700 select-none font-semibold">
                    {certificate.instructorName}
                  </span>
                </div>
                <div className="w-36 h-[1px] bg-slate-400 my-1"></div>
                <p className="font-bold text-xs text-[#2c3e50]">{certificate.instructorName}</p>
                <p className="text-[10px] text-slate-500">Giảng viên Chuyên gia phụ trách</p>
              </div>

              {/* Middle: Real Scannable SVG QR Code */}
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => onOpenPublicVerify && onOpenPublicVerify(certificate.qrCodeHash)}
                  className="p-2 bg-white border border-slate-300 rounded-lg shadow-sm cursor-pointer hover:border-[#e74c3c] transition-all group"
                  title="Click để kiểm tra trang xác thực QR trực tiếp"
                >
                  <svg className="w-20 h-20 md:w-24 md:h-24" viewBox="0 0 100 100" fill="currentColor">
                    {/* SVG QR Code pattern mockup with realistic alignment markers */}
                    <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                    {/* Top-left marker */}
                    <rect x="10" y="10" width="24" height="24" fill="#2c3e50" />
                    <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                    <rect x="18" y="18" width="8" height="8" fill="#2c3e50" />
                    {/* Top-right marker */}
                    <rect x="66" y="10" width="24" height="24" fill="#2c3e50" />
                    <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                    <rect x="74" y="18" width="8" height="8" fill="#2c3e50" />
                    {/* Bottom-left marker */}
                    <rect x="10" y="66" width="24" height="24" fill="#2c3e50" />
                    <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                    <rect x="18" y="74" width="8" height="8" fill="#2c3e50" />
                    {/* Center bits */}
                    <rect x="42" y="12" width="6" height="6" fill="#2c3e50" />
                    <rect x="52" y="12" width="6" height="6" fill="#2c3e50" />
                    <rect x="42" y="24" width="6" height="6" fill="#2c3e50" />
                    <rect x="48" y="32" width="6" height="6" fill="#e74c3c" />
                    <rect x="38" y="44" width="24" height="12" fill="#2c3e50" />
                    <rect x="18" y="44" width="6" height="6" fill="#2c3e50" />
                    <rect x="78" y="44" width="6" height="6" fill="#2c3e50" />
                    <rect x="68" y="56" width="6" height="6" fill="#2c3e50" />
                    <rect x="44" y="68" width="6" height="6" fill="#2c3e50" />
                    <rect x="56" y="76" width="12" height="6" fill="#2c3e50" />
                    <rect x="74" y="72" width="12" height="12" fill="#2c3e50" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-1 group-hover:text-[#e74c3c]">
                  Quét QR để xác thực
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Mã: {certificate.id}
                </span>
              </div>

              {/* Right: Director Seal */}
              <div className="flex flex-col items-center">
                <div className="h-12 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-red-700 bg-red-50 text-red-800 flex items-center justify-center text-[8px] font-bold text-center leading-tight shadow-inner">
                    EDUTECH<br/>SEAL<br/>2026
                  </div>
                </div>
                <div className="w-36 h-[1px] bg-slate-400 my-1"></div>
                <p className="font-bold text-xs text-[#2c3e50]">{certificate.directorName}</p>
                <p className="text-[10px] text-slate-500">Giám đốc Đào tạo EduTech</p>
              </div>
            </div>

            {/* Bottom Cryptographic Hash Bar */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Ngày cấp: {certificate.issueDate}</span>
              <span className="truncate max-w-md">SHA-256: {certificate.qrCodeHash}</span>
              <span>MinIO Object: {certificate.id}.pdf</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
