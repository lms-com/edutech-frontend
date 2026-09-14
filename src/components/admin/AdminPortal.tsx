import React, { useState } from 'react';
import { Course, PayoutRequest, DeviceSession } from '../../types';
import { MOCK_COURSES, MOCK_PAYOUTS, MOCK_DEVICES } from '../../data/mockData';
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
  Users, 
  Eye, 
  Send,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface AdminPortalProps {
  onPreviewCourse: (course: Course) => void;
  onBackToLearner?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onPreviewCourse, onBackToLearner }) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'payouts' | 'devices'>('courses');
  const [coursesList, setCoursesList] = useState<Course[]>(MOCK_COURSES);
  const [payoutList, setPayoutList] = useState<PayoutRequest[]>(MOCK_PAYOUTS);
  const [devicesList, setDevicesList] = useState<DeviceSession[]>(MOCK_DEVICES);

  // Reject Modal state
  const [rejectingCourseId, setRejectingCourseId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const handleApproveCourse = (courseId: string) => {
    setCoursesList(prev => prev.map(c => {
      if (c.id === courseId) {
        return { ...c, status: 'PUBLISHED' as const };
      }
      return c;
    }));
    setActionSuccessMsg(`Đã duyệt khóa học ${courseId} sang trạng thái PUBLISHED thành công.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleRejectCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionNote.trim() || !rejectingCourseId) return;

    setCoursesList(prev => prev.map(c => {
      if (c.id === rejectingCourseId) {
        return { ...c, status: 'REJECTED' as const, rejectionNote: rejectionNote.trim() };
      }
      return c;
    }));

    setActionSuccessMsg(`Đã từ chối khóa học ${rejectingCourseId}. Lý do từ chối đã được gửi qua email giảng viên.`);
    setRejectingCourseId(null);
    setRejectionNote('');
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleApprovePayout = (payoutId: string) => {
    setPayoutList(prev => prev.map(p => {
      if (p.id === payoutId) {
        return { ...p, status: 'APPROVED' as const };
      }
      return p;
    }));
    setActionSuccessMsg(`Đã phê duyệt lệnh rút tiền ${payoutId} qua cổng ngân hàng.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleKickDevice = (deviceId: string) => {
    setDevicesList(prev => prev.filter(d => d.deviceId !== deviceId));
    setActionSuccessMsg(`Đã thu hồi phiên đăng nhập của thiết bị ${deviceId} thành công.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleKickAllOtherDevices = () => {
    setDevicesList(prev => prev.filter(d => d.isCurrent));
    setActionSuccessMsg('Đã đăng xuất toàn bộ thiết bị khác khỏi tài khoản.');
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Back button */}
      {onBackToLearner && (
        <button
          onClick={onBackToLearner}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#2c3e50] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang học viên
        </button>
      )}

      {/* Banner */}
      <div className="bg-[#1e293b] text-white p-6 md:p-8 rounded-3xl shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">Quyền hạn: SUPER_ADMIN</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Cổng Quản Trị & Vận Hành Hệ Thống</h1>
          <p className="text-xs text-slate-300 mt-1">
            Kiểm duyệt nội dung khóa học, phê duyệt thanh toán chiết khấu và quản lý phiên đăng nhập thiết bị.
          </p>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs md:text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {actionSuccessMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        {[
          { id: 'courses', label: 'Kiểm Duyệt Khóa Học (Moderation)', icon: FileText },
          { id: 'payouts', label: 'Duyệt Rút Tiền (Payouts)', icon: DollarSign },
          { id: 'devices', label: 'Giám Sát Đa Thiết Bị (Redis)', icon: Smartphone }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === t.id
                ? 'bg-[#2c3e50] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: COURSE MODERATION */}
      {activeTab === 'courses' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-[#2c3e50]">Danh Sách Khóa Học Chờ Phê Duyệt (Status: PENDING / ALL)</h3>
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
                        <img src={c.thumbnail} alt={c.title} className="w-12 h-8 rounded object-cover" />
                        <div>
                          <p className="font-bold text-slate-800">{c.title}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{c.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700">{c.instructor.name}</td>
                    <td className="p-3 font-bold text-[#2c3e50]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.price)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onPreviewCourse(c)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem trước
                        </button>

                        {c.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveCourse(c.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Duyệt (Publish)
                            </button>

                            <button
                              onClick={() => setRejectingCourseId(c.id)}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1"
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
        </div>
      )}

      {/* TAB 2: PAYOUT APPROVALS */}
      {activeTab === 'payouts' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-[#2c3e50]">Duyệt Yêu Cầu Rút Tiền Từ Giảng Viên (Payout Requests)</h3>
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
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.amount)}
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{p.bankName}</div>
                      <div className="font-mono font-bold text-slate-800">{p.bankAccount} ({p.bankOwner})</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status === 'APPROVED' ? 'Đã chi trả' : 'Chờ duyệt chi'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {p.status === 'PENDING' ? (
                        <button
                          onClick={() => handleApprovePayout(p.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                        >
                          Duyệt Chuyển Khoản
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">Đã tất toán</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REDIS MULTI-DEVICE MANAGEMENT */}
      {activeTab === 'devices' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[#2c3e50]">Quản Trị Thiết Bị Đăng Nhập (Redis Token Store)</h3>
              <p className="text-xs text-slate-500">
                Key Redis: <code className="bg-slate-100 px-1 py-0.5 rounded text-[#e74c3c] font-mono">user:usr_vn_9824:device</code> • Bảo vệ tài khoản tránh chia sẻ trái phép
              </p>
            </div>

            <button
              onClick={handleKickAllOtherDevices}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất khỏi tất cả thiết bị khác (Kick Device)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {devicesList.map(dev => (
              <div
                key={dev.deviceId}
                className={`p-4 rounded-xl border transition-all ${
                  dev.isCurrent
                    ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {dev.os.includes('iOS') ? <Smartphone className="w-5 h-5 text-slate-700" /> : <Laptop className="w-5 h-5 text-slate-700" />}
                    <span className="font-bold text-xs text-[#2c3e50]">{dev.deviceName}</span>
                  </div>
                  {dev.isCurrent && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Hiện tại
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-[11px] text-slate-500 font-mono">
                  <div>IP: <span className="text-slate-700">{dev.ipAddress}</span></div>
                  <div>Trình duyệt: <span className="text-slate-700">{dev.browser}</span></div>
                  <div>HĐH: <span className="text-slate-700">{dev.os}</span></div>
                  <div className="text-slate-400 font-sans mt-2">{dev.lastActive}</div>
                </div>

                {!dev.isCurrent && (
                  <button
                    onClick={() => handleKickDevice(dev.deviceId)}
                    className="w-full mt-3 py-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Thu hồi phiên (Kick)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingCourseId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-[#2c3e50]">Nhập Lý Do Từ Chối Khóa Học</h3>
            </div>
            <p className="text-xs text-slate-500">
              Trường dữ liệu <code className="font-mono text-red-600 font-bold">rejection_note</code> là bắt buộc để hệ thống thông báo cho giảng viên chỉnh sửa lại nội dung.
            </p>

            <form onSubmit={handleRejectCourse} className="space-y-3">
              <textarea
                value={rejectionNote}
                onChange={e => setRejectionNote(e.target.value)}
                placeholder="Ví dụ: Video bài 3 chưa đạt độ phân giải 720p, âm thanh bị rè, giáo trình cần bổ sung tài liệu mã nguồn..."
                rows={4}
                required
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-red-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingCourseId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md"
                >
                  Xác nhận Từ chối & Gửi Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
