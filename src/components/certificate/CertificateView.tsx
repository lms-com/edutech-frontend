import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Certificate } from '../../types';
import { Download, Copy, Check, ShieldCheck, ExternalLink, Award, Printer, AlertCircle } from 'lucide-react';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Mã QR thật, trỏ về đúng điểm vào xác thực của giao diện.
  // Trước đây là một hình SVG vẽ tay nên quét không ra gì.
  useEffect(() => {
    let cancelled = false;
    const verifyUrl = `${window.location.origin}/?verify=${certificate.qrCodeHash}`;
    QRCode.toDataURL(verifyUrl, { width: 240, margin: 1 })
      .then(dataUrl => { if (!cancelled) setQrDataUrl(dataUrl); })
      .catch(err => console.warn('Không sinh được mã QR:', err));
    return () => { cancelled = true; };
  }, [certificate.qrCodeHash]);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(certificate.qrCodeHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    if (certificate.pdfUrl) {
      window.open(certificate.pdfUrl, '_blank', 'noopener');
      return;
    }
    // Chưa có bản PDF trên MinIO thì đành in trang hiện tại
    window.print();
  };

  const hasInstructorName = certificate.instructorName.trim().length > 0;

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700/70 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors cursor-pointer"
              title="Sao chép mã băm xác thực"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã sao chép' : 'Sao chép mã xác thực'}
            </button>

            {onOpenPublicVerify && (
              <button
                onClick={() => onOpenPublicVerify(certificate.qrCodeHash)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Trang xác thực công khai
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            {certificate.pdfUrl ? (
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg transition-colors shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file PDF
              </button>
            ) : (
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors shadow-md cursor-pointer"
                title="Chứng chỉ chưa có bản PDF trên MinIO nên sẽ in trang hiện tại"
              >
                <Printer className="w-3.5 h-3.5" />
                In trang
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            )}
          </div>
        </div>

        {!certificate.pdfUrl && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-800 flex items-center gap-2 print:hidden">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Chứng chỉ này chưa có bản PDF trên MinIO, nút tải sẽ in trang hiện tại.
          </div>
        )}

        {/* Certificate Landscape Body (A4 Ratio) */}
        <div className="p-6 md:p-10 bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center">
          <div
            id="certificate-print-area"
            className="w-full bg-[#fdfdfd] border-[8px] border-double border-[#2c3e50] p-8 md:p-12 relative shadow-lg text-center select-none"
            style={{ minHeight: '520px' }}
          >
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

              <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-full flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                XÁC THỰC MÃ QR
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
                {certificate.studentName || '—'}
              </h2>
              {!certificate.studentName && (
                <p className="text-[10px] text-slate-400 mt-1">Chưa lấy được tên học viên từ hệ thống</p>
              )}
            </div>

            {/* Course Title */}
            <div className="max-w-2xl mx-auto my-4 text-slate-700">
              <p className="text-xs md:text-sm">Đã hoàn thành 100% chương trình đào tạo chuyên sâu và vượt qua bài đánh giá năng lực:</p>
              <h3 className="text-lg md:text-2xl font-bold text-[#e74c3c] mt-1.5 leading-snug">
                {certificate.courseTitle || '—'}
              </h3>
            </div>

            {/* Signatures and QR Code Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 items-end gap-4 text-center">
              {/* Left: Instructor Signature — chỉ hiện khi có tên */}
              {hasInstructorName && (
                <div className="flex flex-col items-center">
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-serif italic text-2xl text-slate-700 select-none font-semibold">
                      {certificate.instructorName}
                    </span>
                  </div>
                  <div className="w-36 h-[1px] bg-slate-400 my-1"></div>
                  <p className="font-bold text-xs text-[#2c3e50]">{certificate.instructorName}</p>
                  <p className="text-[10px] text-slate-500">Giảng viên phụ trách</p>
                </div>
              )}

              {/* QR Code thật, quét được */}
              <div className="flex flex-col items-center">
                <div
                  onClick={() => onOpenPublicVerify && onOpenPublicVerify(certificate.qrCodeHash)}
                  className="p-2 bg-white border border-slate-300 rounded-lg shadow-sm cursor-pointer hover:border-[#e74c3c] transition-all"
                  title="Bấm để mở trang xác thực"
                >
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Mã QR xác thực chứng chỉ" className="w-20 h-20 md:w-24 md:h-24" />
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-[10px] text-slate-400">
                      Đang tạo QR...
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-1">Quét QR để xác thực</span>
                <span className="text-[9px] font-mono text-slate-400">Mã chứng chỉ: {certificate.id}</span>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono gap-2">
              <span>Ngày cấp: {certificate.issueDate || '—'}</span>
              <span className="truncate max-w-md">Mã xác thực: {certificate.qrCodeHash}</span>
              {certificate.pdfUrl && (
                <span className="truncate max-w-[220px]" title={certificate.pdfUrl}>
                  {certificate.pdfUrl.split('/').pop()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
