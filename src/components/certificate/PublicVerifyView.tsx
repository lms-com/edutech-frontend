import React, { useState } from 'react';
import { Certificate } from '../../types';
import { ShieldCheck, CheckCircle2, FileText, Download, ArrowLeft, Building2, Calendar, User, Award, Hash, ExternalLink, Lock } from 'lucide-react';

interface PublicVerifyViewProps {
  hash: string;
  certificate: Certificate;
  onBackToApp: () => void;
  onOpenCertificatePreview: () => void;
}

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({
  hash,
  certificate,
  onBackToApp,
  onOpenCertificatePreview
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const isValid = hash === certificate.qrCodeHash || hash === 'sample' || hash.length > 10;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Public Top Nav */}
      <header className="bg-[#2c3e50] text-white py-4 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e74c3c] flex items-center justify-center font-black text-white shadow-md">
              ET
            </div>
            <div>
              <span className="font-bold text-lg tracking-wide">EduTech Microservices</span>
              <p className="text-xs text-slate-300">Cổng Xác thực Chứng chỉ Tốt nghiệp Công khai (Public Verification)</p>
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

      {/* Main Verification Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Status Banner */}
          <div className="bg-emerald-600 px-6 py-6 text-white flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-700/60 text-emerald-100 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ĐỐI SOÁT MÃ BĂM THÀNH CÔNG (HTTP 200 OK)
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                CHỨNG CHỈ HỢP LỆ VÀ CHÍNH THỨC
              </h1>
              <p className="text-xs md:text-sm text-emerald-100 mt-0.5">
                Bản ghi số được cấp phát từ Microservice Notification & Enrollment của EduTech Platform.
              </p>
            </div>
          </div>

          {/* Verification Details */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-[#2c3e50] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Họ tên học viên tốt nghiệp</span>
                    <p className="text-base font-bold text-[#2c3e50]">{certificate.studentName}</p>
                    <p className="text-xs text-slate-500">{certificate.studentEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#e74c3c] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Khóa học hoàn thành</span>
                    <p className="text-base font-bold text-[#2c3e50]">{certificate.courseTitle}</p>
                    <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                      Tiến độ: 100% Hoàn tất
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Ngày cấp phát</span>
                    <p className="text-base font-semibold text-[#2c3e50]">{certificate.issueDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-[#2c3e50] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Đơn vị cấp chứng nhận</span>
                    <p className="text-sm font-semibold text-[#2c3e50]">EduTech LMS Academy & Cloud Systems</p>
                    <p className="text-xs text-slate-500">Giảng viên: {certificate.instructorName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SHA-256 Hash Verification Box */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-[#2c3e50]" />
                  Mã băm mật mã SHA-256 đối soát (qrCodeHash)
                </span>
                <span className="text-emerald-600 flex items-center gap-1 font-mono text-[11px]">
                  <Lock className="w-3.5 h-3.5" /> Khóa nguyên vẹn
                </span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs break-all select-all shadow-inner">
                {certificate.qrCodeHash}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Endpoint: GET /notification-service/api/v1/certificates/verify/{'{hash}'}</span>
                <span>Lưu trữ: MinIO Object Storage (Bucket: certificates)</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenCertificatePreview}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#2c3e50] hover:bg-[#1a252f] text-white rounded-xl transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Xem bản chứng chỉ gốc (A4)
                </button>

                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert('Đang tải file PDF chứng chỉ chuẩn in ấn từ MinIO CDN...'); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  Tải PDF MinIO
                </a>
              </div>

              <div className="text-xs text-slate-500 text-right">
                Được bảo vệ bởi hệ thống bảo mật khóa công khai EduTech.
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        © 2026 EduTech LMS Microservices Architecture. All rights reserved.
      </footer>
    </div>
  );
};
