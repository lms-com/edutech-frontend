import { useEffect, useState } from 'react';
import { ShieldCheck, Server, Laptop, CheckCircle2 } from 'lucide-react';
import { getDeviceFingerprint } from './utils/fingerprint';

function App() {
  const [fingerprint, setFingerprint] = useState<string>('Đang tạo vân tay...');

  useEffect(() => {
    getDeviceFingerprint().then((fp) => setFingerprint(fp));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-brand-navy rounded-xl flex items-center justify-center text-white">
            <Server className="w-6 h-6 text-brand-red" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">EduTech LMS Frontend</h1>
            <p className="text-sm text-slate-500">Khởi tạo nền móng Ngày 1 thành công!</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Card Gateway Info */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">API Gateway URL</span>
            </div>
            <span className="text-sm font-semibold text-brand-navy bg-slate-200 px-3 py-1 rounded-md font-mono">
              http://localhost:8080
            </span>
          </div>

          {/* Card Fingerprint Info */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Laptop className="w-5 h-5 text-brand-accent" />
              <span className="text-sm font-medium text-slate-700">Device Fingerprint hiện tại</span>
            </div>
            <p className="text-xs font-mono text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
              {fingerprint}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              * Mã này được tự động gắn vào Header <code>X-Device-Fingerprint</code> để Gateway kiểm soát đa thiết bị.
            </p>
          </div>

          {/* Checklist ngày 1 */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
              Checklist Ngày 1 Hoàn Thành
            </h3>
            <ul className="space-y-1.5 text-xs text-emerald-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Vite + React + TypeScript + Tailwind CSS v4
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                AxiosClient Interceptor tích hợp Token & Device Fingerprint
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Zustand Auth Store quản lý trạng thái đăng nhập
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Độc lập Git repository trên nhánh <code>main</code>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">EduTech LMS Architecture</span>
          <button className="bg-brand-red hover:bg-red-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition duration-200 shadow-md">
            Sẵn sàng cho Ngày 2 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
