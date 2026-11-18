import React, { useCallback, useEffect, useState } from 'react';
import userApi, { type AdminUserItem } from '../../../api/userApi';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

interface AdminUserManagementTabProps {
  onSuccess: (msg: string) => void;
}

export const AdminUserManagementTab: React.FC<AdminUserManagementTabProps> = ({ onSuccess }) => {
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTogglingId, setUserTogglingId] = useState<string | null>(null);

  const loadUsers = useCallback(async (page = 0, search = userSearchTerm) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await userApi.getUsers({ page, size: 10, search });
      setUsersList(res.items);
      setUserCurrentPage(res.page);
      setUserTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setUsersError(err?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearchTerm]);

  useEffect(() => {
    void loadUsers(0);
  }, []);

  const handleToggleUserStatus = async (user: AdminUserItem) => {
    const nextStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    const actionLabel = nextStatus === 'BANNED' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionLabel} tài khoản "${user.email}"?`)) return;
    setUserTogglingId(user.id);
    try {
      await userApi.updateUserStatus(user.id, {
        status: nextStatus,
        reason: nextStatus === 'BANNED'
          ? 'Quản trị viên khóa tài khoản vi phạm quy định'
          : 'Quản trị viên khôi phục quyền truy cập',
      });
      onSuccess(`Đã ${actionLabel} tài khoản ${user.email} thành công!`);
      await loadUsers(userCurrentPage);
    } catch (err: any) {
      alert(err?.message || `Không thể ${actionLabel} tài khoản.`);
    } finally {
      setUserTogglingId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Quản Lý Tài Khoản Người Dùng Toàn Hệ Thống</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu người dùng, phân quyền vai trò (Admin / Giảng viên / Học viên) và khóa/mở khóa tài khoản trực tiếp qua IAM Service.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void loadUsers(0, userSearchTerm);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={usersLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Tìm
          </button>
          <button
            type="button"
            onClick={() => {
              setUserSearchTerm('');
              void loadUsers(0, '');
            }}
            disabled={usersLoading}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {usersError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{usersError}</span>
        </div>
      )}

      {usersLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs">Đang tải danh sách tài khoản từ IAM Service...</p>
        </div>
      ) : usersList.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Không tìm thấy tài khoản người dùng nào</p>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bấm tải lại</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Vai Trò</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((user) => {
                  const isBanned = user.status === 'BANNED';
                  const isActive = user.status === 'ACTIVE';
                  const isToggling = userTogglingId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span>{user.fullName || 'Chưa cập nhật'}</span>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {user.id}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{user.email}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <span
                                key={role}
                                className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                                  role === 'ROLE_ADMIN' || role === 'ADMIN'
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : role === 'ROLE_INSTRUCTOR' || role === 'INSTRUCTOR'
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {role.replace('ROLE_', '')}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px]">Chưa gán</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isBanned
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Hoạt Động</span>
                            </>
                          ) : isBanned ? (
                            <>
                              <Lock className="w-3 h-3 text-rose-600" />
                              <span>Đã Khóa</span>
                            </>
                          ) : (
                            <span>{user.status}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => void handleToggleUserStatus(user)}
                          disabled={isToggling}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                            isBanned
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isBanned ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Mở Khóa</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Khóa Tài Khoản</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {userTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Trang {userCurrentPage + 1} / {userTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void loadUsers(userCurrentPage - 1)}
                  disabled={userCurrentPage <= 0 || usersLoading}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                >
                  Trang trước
                </button>
                <button
                  onClick={() => void loadUsers(userCurrentPage + 1)}
                  disabled={userCurrentPage >= userTotalPages - 1 || usersLoading}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
