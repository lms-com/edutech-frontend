import React, { useEffect, useState } from 'react';
import type { Certificate } from '../../types';
import notificationApi from '../../api/notificationApi';
import {
  ShieldCheck, CheckCircle2, FileText, Download, ArrowLeft, Calendar, Award,
  Hash, Lock, AlertCircle, Loader2, SearchX,
} from 'lucide-react';

interface PublicVerifyViewProps {
  hash: string;
  onBackToApp: () => void;
  onOpenCertificatePreview: (certificate: Certificate) => void;
}

type VerifyState = 'loading' | 'valid' | 'invalid' | 'error';

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({
  hash,
  onBackToApp,
  onOpenCertificatePreview
}) => {
  const [state, setState] = useState<VerifyState>('loading');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) {
      setState('invalid');
      return;
    }
    let cancelled = false;
    const verify = async () => {
      setState('loading');
      setErrorMessage(null);
      try {
        const found = await notificationApi.verifyCertificate(hash);
        if (!cancelled) {
          setCertificate(found);
          setState('valid');
        }
      } catch (err: any) {
        if (cancelled) return;
        // 404 nghĩa là không có chứng chỉ ứng với mã băm này
        if (err?.code === 404 || err?.code === 400) {
          setState('invalid');
        } else {
          setState('error');
          setErrorMessage(err?.message || 'Không tra cứu được chứng chỉ.');
        }
      }
    };
    void verify();
    return () => { cancelled = true; };
  }, [hash]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-[#2c3e50] text-white py-4 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e74c3c] flex items-center justify-center font-black text-white shadow-md">
              ET
            </div>
            <div>
              <span className="font-bold text-lg tracking-wide">EduTech Microservices</span>
              <p className="text-xs text-slate-300">Cổng Xác thực Chứng chỉ Tốt nghiệp Công khai</p>
            </div>
          </div>

          <button
            onClick={onBackToApp}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-medium bg-slate-700/80 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Hệ thống EduTech LMS
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {state === 'loading' && (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Đang đối soát mã băm với hệ thống...</p>
            </div>
          )}

          {state === 'invalid' && (
            <div className="p-10 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center">
                <SearchX className="w-8 h-8 text-rose-600" />
              </div>
              <h1 className="text-xl font-bold text-rose-700">
                KHÔNG TÌM THẤY CHỨNG CHỈ HỢP LỆ
              </h1>
              <p className="text-sm text-slate-600">
                Mã băm <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{hash || '(trống)'}</span> không
                ứng với chứng chỉ nào do hệ thống cấp phát.
              </p>
              <p className="text-xs text-slate-500">
                Vui lòng kiểm tra lại đường dẫn hoặc quét lại mã QR trên bản chứng chỉ gốc.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="p-10 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-lg font-bold text-amber-700">Không tra cứu được chứng chỉ</h1>
              <p className="text-sm text-slate-600">{errorMessage}</p>
            </div>
          )}

          {state === 'valid' && certificate && (
            <>
              <div className="bg-emerald-600 px-6 py-6 text-white flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldCheck className="w-9 h-9 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-700/60 text-emerald-100 text-xs font-semibold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ĐỐI SOÁT MÃ BĂM THÀNH CÔNG
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                    CHỨNG CHỈ CÓ TRONG HỆ THỐNG
                  </h1>
                  <p className="text-xs md:text-sm text-emerald-100 mt-0.5">
                    Bản ghi được cấp phát từ Notification Service của EduTech Platform.
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-[#e74c3c] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Khóa học</span>
                        <p className="text-base font-bold text-[#2c3e50]">
                          {certificate.courseTitle || certificate.courseId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Hash className="w-5 h-5 text-[#2c3e50] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Mã học viên</span>
                        <p className="text-sm font-mono text-slate-700">{certificate.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Ngày cấp phát</span>
                        <p className="text-base font-semibold text-[#2c3e50]">{certificate.issueDate || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-[#2c3e50]" />
                      Mã băm đối soát (qrCodeHash)
                    </span>
                    <span className="text-emerald-600 flex items-center gap-1 font-mono text-[11px]">
                      <Lock className="w-3.5 h-3.5" /> Khớp bản ghi
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs break-all select-all shadow-inner">
                    {certificate.qrCodeHash}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenCertificatePreview(certificate)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#2c3e50] hover:bg-[#1a252f] text-white rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Xem bản chứng chỉ gốc
                    </button>

                    {certificate.pdfUrl ? (
                      <a
                        href={certificate.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                      >
                        <Download className="w-4 h-4 text-slate-600" />
                        Tải PDF
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">Bản PDF chưa sẵn sàng.</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        © 2026 EduTech LMS Microservices Architecture. All rights reserved.
      </footer>
    </div>
  );
};

export default PublicVerifyView;
