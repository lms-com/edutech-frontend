import React, { useState } from 'react';
import type { Course } from '../../../types';
import courseApi from '../../../api/courseApi';
import { formatVND } from '../../../utils/format';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Loader2,
  XCircle,
} from 'lucide-react';

interface AdminCourseModerationTabProps {
  coursesList: Course[];
  coursesLoading: boolean;
  coursesError: string | null;
  onPreviewCourse: (course: Course) => void;
  onReloadCourses: () => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string | null) => void;
}

export const AdminCourseModerationTab: React.FC<AdminCourseModerationTabProps> = ({
  coursesList,
  coursesLoading,
  coursesError,
  onPreviewCourse,
  onReloadCourses,
  onSuccess,
  onError,
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectingCourseId, setRejectingCourseId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const handleApproveCourse = async (courseId: string) => {
    setActionLoading(true);
    onError(null);
    try {
      await courseApi.approveCourse(courseId);
      onSuccess(`Đã duyệt khóa học ${courseId} thành công.`);
      await onReloadCourses();
    } catch (err: any) {
      onError(err?.status === 403
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
    onError(null);
    try {
      await courseApi.rejectCourse(rejectingCourseId, rejectionNote.trim());
      onSuccess(`Đã từ chối khóa học ${rejectingCourseId}.`);
      setRejectingCourseId(null);
      setRejectionNote('');
      await onReloadCourses();
    } catch (err: any) {
      onError(err?.status === 403
        ? 'Tài khoản hiện tại không có quyền kiểm duyệt khóa học.'
        : err?.message || 'Không từ chối được khóa học.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
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
    </>
  );
};
