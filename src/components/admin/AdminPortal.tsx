import React, { useCallback, useEffect, useState } from 'react';
import type { Course, PayoutRequest, DeviceSession, Certificate } from '../../types';
import { MOCK_PAYOUTS } from '../../data/mockData';
import courseApi from '../../api/courseApi';
import notificationApi from '../../api/notificationApi';
import deviceApi from '../../api/deviceApi';
import { getDeviceFingerprint } from '../../utils/fingerprint';
import { formatVND } from '../../utils/format';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Smartphone, 
  Laptop, 
  LogOut, 
  Check, 
  FileText, 
  DollarSign, 
  Eye, 
  ArrowLeft,
  Award,
  Search,
  Copy,
  ExternalLink,
  ShieldCheck,
  Calendar,
  UserCheck,
  Loader2,
  RefreshCw,
  QrCode,
  FileCheck2,
  BookOpen,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface AdminPortalProps {
  onPreviewCourse: (course: Course) => void;
  onBackToLearner?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onPreviewCourse, onBackToLearner }) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'certificates' | 'payouts' | 'devices'>('courses');
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [payoutList, setPayoutList] = useState<PayoutRequest[]>(MOCK_PAYOUTS);
  const [devicesList, setDevicesList] = useState<DeviceSession[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');

  // Reject Modal state
  const [rejectingCourseId, setRejectingCourseId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Certificate Audit state
  const [certSearchQuery, setCertSearchQuery] = useState('');
  const [certSearching, setCertSearching] = useState(false);
  const [certResult, setCertResult] = useState<Certificate | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const loadPendingCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const page = await courseApi.getAdminCourses({ size: 100, status: 'PENDING' });
      setCoursesList(page.items);
    } catch (err: any) {
      setCoursesError(err?.message || 'Không tải được hàng chờ kiểm duyệt.');
      setCoursesList([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const loadDevices = useCallback(async (searchQuery?: string) => {
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const myFp = await getDeviceFingerprint();
      const list = await deviceApi.getAdminDevices(searchQuery, myFp);
      setDevicesList(list);
    } catch (err: any) {
      setDevicesError(err?.message || 'Không tải được danh sách thiết bị từ Redis.');
      setDevicesList([]);
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPendingCourses();
  }, [loadPendingCourses]);

  useEffect(() => {
    if (activeTab === 'devices') {
      void loadDevices();
    }
  }, [activeTab, loadDevices]);

  const handleApproveCourse = async (courseId: string) => {
    setActionLoading(true);
    setCoursesError(null);
    try {
      await courseApi.approveCourse(courseId);
      setActionSuccessMsg(`Đã duyệt khóa học ${courseId} thành công.`);
      await loadPendingCourses();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setCoursesError(err?.status === 403
        ? 'Tài khoản hiện tại không có quyền kiểm duyệt khóa học.'
        : err?.message || 'Không duyệt được khóa học.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionNote.trim() || !rejectingCourseId) return;
    setActionLoading(true);
    setCoursesError(null);
    try {
      await courseApi.rejectCourse(rejectingCourseId, rejectionNote.trim());
      setActionSuccessMsg(`Đã từ chối khóa học ${rejectingCourseId}.`);
      setRejectingCourseId(null);
      setRejectionNote('');
      await loadPendingCourses();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setCoursesError(err?.status === 403
        ? 'Tài khoản hiện tại không có quyền kiểm duyệt khóa học.'
        : err?.message || 'Không từ chối được khóa học.');
    } finally {
      setActionLoading(false);
    }
  };

  // Certificate Audit Handler (Real API from Notification Service)
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

  const handleApprovePayout = (payoutId: string) => {
    setPayoutList(prev => prev.map(p => {
      if (p.id === payoutId) {
        return { ...p, status: 'APPROVED' as const };
      }
      return p;
    }));
    setActionSuccessMsg(`[Bản mẫu] Giao diện đổi ${payoutId} sang APPROVED; chưa có lệnh chuyển khoản nào được gửi.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleKickDevice = async (dev: DeviceSession) => {
    const fp = dev.deviceFingerprint || dev.deviceId;
    if (!dev.userId) {
      setDevicesList(prev => prev.filter(d => d.deviceId !== dev.deviceId));
      return;
    }
    setActionLoading(true);
    try {
      await deviceApi.revokeDevice(dev.userId, fp);
      setActionSuccessMsg(`Đã thu hồi phiên và chặn thiết bị #${fp.slice(0, 8)} của người dùng ${dev.userEmail || dev.userId}.`);
      await loadDevices(deviceSearchQuery);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setDevicesError(err?.message || 'Không thể thu hồi phiên thiết bị.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleKickAllOtherDevices = async () => {
    const otherDevices = devicesList.filter(d => !d.isCurrent && d.userId);
    if (otherDevices.length === 0) {
      setActionSuccessMsg('Không có thiết bị phụ nào để thu hồi.');
      setTimeout(() => setActionSuccessMsg(''), 3000);
      return;
    }
    setActionLoading(true);
    try {
      for (const dev of otherDevices) {
        const fp = dev.deviceFingerprint || dev.deviceId;
        if (dev.userId) {
          await deviceApi.revokeDevice(dev.userId, fp);
        }
      }
      setActionSuccessMsg(`Đã thu hồi thành công ${otherDevices.length} thiết bị khỏi hệ thống.`);
      await loadDevices(deviceSearchQuery);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setDevicesError(err?.message || 'Có lỗi xảy ra khi thu hồi phiên các thiết bị.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Return to Learner Link if available */}
      {onBackToLearner && (
        <button
          onClick={onBackToLearner}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại trang học viên
        </button>
      )}

      {/* Admin Space Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Không gian Quản trị viên
            </span>
            <span className="text-xs text-slate-400 font-mono">Phiên bảo mật: System Host</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1 text-white">
            Cổng Quản Trị & Vận Hành Hệ Thống
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Thẩm định nội dung khóa học, đối soát và xác thực chứng chỉ số trên toàn hệ thống, giám sát tài chính và phiên thiết bị đăng nhập.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadPendingCourses()}
            disabled={coursesLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${coursesLoading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {coursesError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{coursesError}</span>
        </div>
      )}

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs md:text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Primary Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { 
            id: 'courses', 
            label: 'Kiểm Duyệt Khóa Học (Moderation)', 
            icon: FileText,
            badge: coursesList.filter(c => c.status === 'PENDING').length || undefined
          },
          { 
            id: 'certificates', 
            label: 'Thẩm Định & Tra Cứu Chứng Chỉ (Audit)', 
            icon: Award 
          },
          { 
            id: 'payouts', 
            label: 'Duyệt Rút Tiền (Payouts)', 
            icon: DollarSign 
          },
          { 
            id: 'devices', 
            label: 'Giám Sát Đa Thiết Bị (Redis)', 
            icon: Smartphone 
          }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold ml-1">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: COURSE MODERATION */}
      {activeTab === 'courses' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Danh Sách Khóa Học Chờ Phê Duyệt</h3>
              <p className="text-xs text-slate-500">
                Khóa học ở trạng thái PENDING gửi từ Giảng viên cần Admin thẩm định nội dung trước khi xuất bản ra thị trường.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              Chờ duyệt: {coursesList.filter(c => c.status === 'PENDING').length}
            </span>
          </div>

          {coursesLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách chờ kiểm duyệt...
            </div>
          ) : coursesList.length === 0 && !coursesError ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700">Hiện không có khóa học nào chờ duyệt!</p>
              <p className="text-xs text-slate-400">Tất cả các khóa học mới đã được thẩm định xong.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Khóa học</th>
                    <th className="p-3">Giảng viên</th>
                    <th className="p-3">Giá đề xuất</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác thẩm định</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coursesList.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img src={c.thumbnail} alt={c.title} className="w-12 h-8 rounded object-cover border border-slate-200" />
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{c.title}</p>
                            <span className="text-[10px] text-slate-400 font-mono">Mã: {c.id} • {c.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700">{c.instructor?.name || 'Giảng viên'}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {formatVND(c.price)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          c.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onPreviewCourse(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Xem trước nội dung giáo trình của khóa học"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Xem trước
                          </button>

                          {c.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApproveCourse(c.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition disabled:opacity-50 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Duyệt (Publish)
                              </button>

                              <button
                                onClick={() => setRejectingCourseId(c.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition disabled:opacity-50 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CERTIFICATE AUDIT & VERIFICATION (ADMIN-SPECIFIC LOGIC) */}
      {activeTab === 'certificates' && (
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

          {/* Search Form */}
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

            {/* Quick Test Samples */}
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

          {/* Error / Invalid Certificate State */}
          {certError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>CẢNH BÁO: KẾT QUẢ THẨM ĐỊNH KHÔNG HỢP LỆ</span>
              </div>
              <p className="leading-relaxed pl-6">{certError}</p>
            </div>
          )}

          {/* Audit Success Result Card */}
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

              {/* Certificate Audit Details Grid */}
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

              {/* Cryptographic SHA-256 Hash Verification */}
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

          {/* Operational Policy Guide */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Quy chuẩn cấp phát chứng chỉ số EduTech LMS:</p>
            <p className="leading-relaxed">
              Chứng chỉ chỉ được hệ thống tự động sinh ra khi học viên hoàn thành 100% tiến độ bài học và vượt qua điểm sàn bài Quiz. Toàn bộ chứng chỉ đều được Notification Service tính toán mã băm SHA-256 duy nhất gắn liền với ID học viên và khóa học để đảm bảo tính pháp lý khi quét mã QR.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: PAYOUT APPROVALS */}
      {activeTab === 'payouts' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Duyệt Yêu Cầu Rút Tiền Từ Giảng Viên (Payout Requests)</h3>
              <p className="text-xs text-slate-500">Đối soát số dư và phê duyệt lệnh chi trả doanh thu giảng dạy.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              Dữ liệu mô phỏng (Chờ Finance Service)
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Giảng viên</th>
                  <th className="p-3">Số tiền</th>
                  <th className="p-3">Thông tin ngân hàng</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payoutList.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{p.instructorName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                    </td>
                    <td className="p-3 font-bold text-emerald-700 text-sm">
                      {formatVND(p.amount)}
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{p.bankName}</div>
                      <div className="font-mono font-bold text-slate-800">{p.bankAccount} ({p.bankOwner})</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {p.status === 'APPROVED' ? 'Đã chi trả' : 'Chờ duyệt chi'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {p.status === 'PENDING' ? (
                        <button
                          onClick={() => handleApprovePayout(p.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          Duyệt Chuyển Khoản
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">Đã tất toán</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REDIS MULTI-DEVICE MANAGEMENT */}
      {activeTab === 'devices' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Quản Trị Thiết Bị Đăng Nhập (Redis Token Store)</h3>
              <p className="text-xs text-slate-500">
                Key Redis: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">user:&#123;userId&#125;:device</code> • Giới hạn tối đa 2 thiết bị đồng thời để chống chia sẻ tài khoản.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadDevices(deviceSearchQuery)}
                disabled={devicesLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${devicesLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              <button
                onClick={handleKickAllOtherDevices}
                disabled={actionLoading || devicesList.filter(d => !d.isCurrent).length === 0}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất khỏi tất cả thiết bị khác
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo email hoặc tên người dùng..."
              value={deviceSearchQuery}
              onChange={e => setDeviceSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void loadDevices(deviceSearchQuery); }}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {devicesError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{devicesError}</span>
            </div>
          )}

          {devicesLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-slate-600" />
              <p className="text-xs font-medium">Đang tải danh sách thiết bị từ Redis...</p>
            </div>
          ) : devicesList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl">
              Không có phiên thiết bị nào đang hoạt động phù hợp với tiêu chí tìm kiếm.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {devicesList.map(dev => (
                <div
                  key={`${dev.userId}-${dev.deviceId}`}
                  className={`p-4 rounded-xl border transition-all ${
                    dev.isCurrent
                      ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/50'
                      : dev.isBlocked
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-5 h-5 text-slate-700" />
                      <span className="font-bold text-xs text-slate-900">{dev.deviceName}</span>
                    </div>
                    {dev.isCurrent ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Hiện tại
                      </span>
                    ) : dev.isBlocked ? (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                        Đã chặn
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        Hoạt động
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-500 font-mono">
                    {dev.userEmail && (
                      <div>User: <span className="text-slate-800 font-bold">{dev.userEmail}</span></div>
                    )}
                    {dev.userFullName && (
                      <div>Họ tên: <span className="text-slate-700 font-sans">{dev.userFullName}</span></div>
                    )}
                    <div className="truncate">FP: <span className="text-slate-600 font-mono" title={dev.deviceFingerprint || dev.deviceId}>{(dev.deviceFingerprint || dev.deviceId).slice(0, 16)}...</span></div>
                    <div className="text-slate-400 font-sans mt-2 flex items-center gap-1">
                      <span>Đăng nhập: {dev.lastActive}</span>
                    </div>
                  </div>

                  {!dev.isCurrent && !dev.isBlocked && (
                    <button
                      onClick={() => handleKickDevice(dev)}
                      disabled={actionLoading}
                      className="w-full mt-3 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Thu hồi phiên (Kick)
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingCourseId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Nhập Lý Do Từ Chối Khóa Học</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trường dữ liệu <code className="font-mono text-rose-600 font-bold">rejection_note</code> là bắt buộc để hệ thống thông báo cho giảng viên chỉnh sửa lại nội dung.
            </p>

            <form onSubmit={handleRejectCourse} className="space-y-3">
              <textarea
                value={rejectionNote}
                onChange={e => setRejectionNote(e.target.value)}
                placeholder="Ví dụ: Video bài 3 chưa đạt độ phân giải 720p, âm thanh bị rè, giáo trình cần bổ sung tài liệu mã nguồn..."
                rows={4}
                required
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingCourseId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Đang gửi...' : 'Xác nhận Từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
