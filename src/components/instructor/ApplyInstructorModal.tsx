import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  GraduationCap, 
  Video, 
  Briefcase, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send,
  Loader2,
  Sparkles
} from 'lucide-react';
import instructorApplicationApi, { type InstructorApplicationDto } from '../../api/instructorApplicationApi';

interface ApplyInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApplyInstructorModal: React.FC<ApplyInstructorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(2);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [cvUrl, setCvUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [myApplications, setMyApplications] = useState<InstructorApplicationDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await instructorApplicationApi.getMyApplications();
      setMyApplications(list);
    } catch (err) {
      console.warn('Không tải được lịch sử đơn giảng viên:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const pendingApp = myApplications.find(a => a.status === 'PENDING');
  const approvedApp = myApplications.find(a => a.status === 'APPROVED');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bio.trim() || !expertise.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tiểu sử và lĩnh vực chuyên môn.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await instructorApplicationApi.submitApplication({
        bio: bio.trim(),
        expertise: expertise.trim(),
        experienceYears: Number(experienceYears) || 0,
        portfolioUrl: portfolioUrl.trim() || undefined,
        cvUrl: cvUrl.trim() || undefined,
      });

      setSuccessMsg('Nộp đơn đăng ký thành công! Quản trị viên sẽ xem xét hồ sơ của bạn trong vòng 24 - 48 giờ.');
      setBio('');
      setExpertise('');
      setPortfolioUrl('');
      setCvUrl('');
      await loadHistory();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể gửi đơn đăng ký. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2c3e50] via-slate-800 to-indigo-950 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
              <Video className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg">Đăng Ký Trở Thành Giảng Viên</h3>
              <p className="text-xs text-slate-300 mt-0.5">Chia sẻ kiến thức chuyên môn và gia tăng thu nhập cùng EduTech LMS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Trạng thái nếu đã có đơn APPROVED */}
          {approvedApp && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Chúc mừng! Bạn đã là Giảng viên chính thức</span>
              </div>
              <p className="text-slate-600">
                Tài khoản của bạn đã được quản trị viên phê duyệt. Bạn có thể chuyển sang cổng <strong>Studio Giảng viên</strong> trên thanh điều hướng để bắt đầu soạn giáo trình và tạo khóa học.
              </p>
            </div>
          )}

          {/* Trạng thái nếu có đơn đang PENDING */}
          {pendingApp && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Đơn đăng ký của bạn đang được xét duyệt</span>
              </div>
              <p className="text-slate-600">
                Hồ sơ chuyên môn: <strong>{pendingApp.expertise}</strong> ({pendingApp.experienceYears} năm kinh nghiệm). Quản trị viên đang xem xét thông tin và sẽ phản hồi sớm qua thông báo chuông hệ thống.
              </p>
            </div>
          )}

          {/* Form nộp đơn nếu chưa có đơn hoặc đơn trước bị từ chối */}
          {!pendingApp && !approvedApp && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-indigo-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Quyền lợi giảng viên: Hưởng tỷ lệ chia sẻ doanh thu <strong>70%</strong>, quyền phát hành bài giảng video và trắc nghiệm tự động, rút tiền minh bạch về tài khoản ngân hàng thụ hưởng.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lĩnh vực chuyên môn chính <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={expertise}
                    onChange={e => setExpertise(e.target.value)}
                    placeholder="Ví dụ: Lập trình Java Spring Boot, Thiết kế UI/UX, Data Science..."
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số năm kinh nghiệm
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={e => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Liên kết Portfolio / LinkedIn / GitHub
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={e => setPortfolioUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Liên kết CV hoặc Hồ sơ năng lực (Google Drive / PDF / MinIO)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={cvUrl}
                    onChange={e => setCvUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiểu sử & Giới thiệu kinh nghiệm giảng dạy <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Mô tả ngắn về bạn, các dự án thực tế đã làm và định hướng khóa học bạn muốn phát triển trên EduTech LMS..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi hồ sơ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi đơn đăng ký giảng viên</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Lịch sử đơn đã nộp */}
          {myApplications.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Lịch sử xét duyệt của bạn</h4>
              <div className="space-y-2">
                {myApplications.map(app => (
                  <div key={app.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{app.expertise}</p>
                      <p className="text-[11px] text-slate-400">
                        Nộp ngày: {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                      {app.rejectionReason && (
                        <p className="text-[11px] text-rose-600 mt-1">Lý do từ chối: {app.rejectionReason}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      app.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {app.status === 'APPROVED' ? 'Đã duyệt' : app.status === 'REJECTED' ? 'Từ chối' : 'Đang chờ'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
