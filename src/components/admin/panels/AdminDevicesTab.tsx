import React, { useCallback, useEffect, useState } from 'react';
import type { DeviceSession } from '../../../types';
import deviceApi from '../../../api/deviceApi';
import { getDeviceFingerprint } from '../../../utils/fingerprint';
import {
  AlertTriangle,
  Laptop,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
} from 'lucide-react';

interface AdminDevicesTabProps {
  onSuccess: (msg: string) => void;
  onCountChange: (count: number) => void;
}

export const AdminDevicesTab: React.FC<AdminDevicesTabProps> = ({
  onSuccess,
  onCountChange,
}) => {
  const [devicesList, setDevicesList] = useState<DeviceSession[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadDevices = useCallback(async (searchQuery?: string) => {
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const myFp = await getDeviceFingerprint();
      const list = await deviceApi.getAdminDevices(searchQuery, myFp);
      setDevicesList(list);
      onCountChange(list.length);
    } catch (err: any) {
      setDevicesError(err?.message || 'Không tải được danh sách thiết bị từ Redis.');
      setDevicesList([]);
    } finally {
      setDevicesLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const handleKickDevice = async (dev: DeviceSession) => {
    const fp = dev.deviceFingerprint || dev.deviceId;
    if (!dev.userId) {
      setDevicesList(prev => prev.filter(d => d.deviceId !== dev.deviceId));
      return;
    }
    setActionLoading(true);
    try {
      await deviceApi.deleteDevice(dev.userId, fp);
      onSuccess(`Đã thu hồi phiên và chặn thiết bị #${fp.slice(0, 8)} của người dùng ${dev.userEmail || dev.userId}.`);
      await loadDevices(deviceSearchQuery);
    } catch (err: any) {
      setDevicesError(err?.message || 'Không thể thu hồi phiên thiết bị.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleKickAllOtherDevices = async () => {
    const otherDevices = devicesList.filter(d => !d.isCurrent && d.userId);
    if (otherDevices.length === 0) {
      onSuccess('Không có thiết bị phụ nào để thu hồi.');
      return;
    }
    setActionLoading(true);
    try {
      for (const dev of otherDevices) {
        const fp = dev.deviceFingerprint || dev.deviceId;
        if (dev.userId) {
          await deviceApi.deleteDevice(dev.userId, fp);
        }
      }
      onSuccess(`Đã thu hồi thành công ${otherDevices.length} thiết bị khỏi hệ thống.`);
      await loadDevices(deviceSearchQuery);
    } catch (err: any) {
      setDevicesError(err?.message || 'Có lỗi xảy ra khi thu hồi phiên các thiết bị.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
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
                <div className="truncate text-slate-500 font-sans">
                  Mã phiên: <span className="text-slate-700 font-mono text-[10px]" title={dev.deviceFingerprint || dev.deviceId}>{(dev.deviceFingerprint || dev.deviceId).slice(0, 16)}...</span>
                </div>
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
  );
};
