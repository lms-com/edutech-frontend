import React, { useState } from 'react';
import { Course, PayoutRequest } from '../../types';
import { MOCK_PAYOUTS } from '../../data/mockData';
import { 
  Users, 
  DollarSign, 
  Wallet, 
  Star, 
  Plus, 
  UploadCloud, 
  FileVideo, 
  CheckCircle2, 
  Clock, 
  Send, 
  Sparkles, 
  Layers, 
  CreditCard,
  Building,
  HelpCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface InstructorStudioProps {
  course: Course;
  onEnterLearningRoom: (course: Course) => void;
  onBackToLearner?: () => void;
}

export const InstructorStudio: React.FC<InstructorStudioProps> = ({
  course,
  onEnterLearningRoom,
  onBackToLearner
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'curriculum' | 'upload' | 'payouts'>('dashboard');

  // Video Upload Simulation State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'GETTING_PRESIGNED' | 'UPLOADING' | 'FFMPEG_PROCESSING' | 'COMPLETED'>('IDLE');
  const [selectedLessonTitle, setSelectedLessonTitle] = useState('Bài 8: Cấu hình Distributed Tracing với Zipkin & Sleuth');

  // Payout Form State
  const [payoutAmount, setPayoutAmount] = useState('5000000');
  const [bankName, setBankName] = useState('Vietcombank (Chi nhánh Tân Bình)');
  const [bankAccount, setBankAccount] = useState('0071001234567');
  const [payoutList, setPayoutList] = useState<PayoutRequest[]>(MOCK_PAYOUTS);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  // Curriculum State
  const [sections, setSections] = useState(course.sections);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Handle Video Upload Simulation to MinIO
  const handleSimulateUpload = () => {
    setUploadStatus('GETTING_PRESIGNED');
    setUploadProgress(10);

    setTimeout(() => {
      setUploadStatus('UPLOADING');
      let currentProg = 10;
      const interval = setInterval(() => {
        currentProg += 15;
        setUploadProgress(currentProg);
        if (currentProg >= 100) {
          clearInterval(interval);
          setUploadStatus('FFMPEG_PROCESSING');

          // Simulate background FFmpeg HLS segmentation & AES-128 key generation
          setTimeout(() => {
            setUploadStatus('COMPLETED');
          }, 2500);
        }
      }, 300);
    }, 1000);
  };

  const handleCreatePayoutRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newReq: PayoutRequest = {
      id: `pay_${Date.now()}`,
      instructorId: 'inst_01',
      instructorName: 'TS. Trần Minh Khoa',
      amount: amountNum,
      bankName: bankName,
      bankAccount: bankAccount,
      bankOwner: 'TRAN MINH KHOA',
      status: 'PENDING',
      requestedAt: 'Vừa xong'
    };

    setPayoutList([newReq, ...payoutList]);
    setPayoutSuccessMsg(`Yêu cầu rút ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amountNum)} đã được gửi đến Admin Portal phê duyệt.`);
    setTimeout(() => setPayoutSuccessMsg(''), 5000);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    const newSec = {
      id: `sec_${Date.now()}`,
      title: newSectionTitle.trim(),
      lessons: []
    };
    setSections([...sections, newSec]);
    setNewSectionTitle('');
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

      {/* Studio Header Banner */}
      <div className="bg-[#1e293b] text-white p-6 md:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#e74c3c] text-white text-xs font-bold uppercase tracking-wider">
              Instructor Studio
            </span>
            <span className="text-xs text-slate-300 font-mono">Giảng viên: TS. Trần Minh Khoa</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Không Gian Quản Trị Khóa Học & Doanh Thu</h1>
          <p className="text-xs text-slate-300 mt-1">
            Soạn giáo trình, tải video bài giảng lên MinIO Object Storage và quản lý rút tiền hoa hồng.
          </p>
        </div>

        <button
          onClick={() => onEnterLearningRoom(course)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          Xem thử dưới góc nhìn Học viên
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Bảng số liệu KPI', icon: Users },
          { id: 'curriculum', label: 'Curriculum Builder (Giáo trình)', icon: Layers },
          { id: 'upload', label: 'Upload Video MinIO (HLS)', icon: UploadCloud },
          { id: 'payouts', label: 'Ví & Yêu cầu Rút tiền', icon: Wallet }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
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

      {/* TAB 1: KPI DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tổng học viên đang học</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-[#2c3e50]">18,450</h3>
              <span className="text-[11px] text-emerald-600 font-semibold">+14.2% so với tháng trước</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Doanh thu trong tháng</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-[#2c3e50]">64,500,000 đ</h3>
              <span className="text-[11px] text-emerald-600 font-semibold">82 lượt mua mới</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Số dư ví khả dụng (InstructorBalance)</span>
                <Wallet className="w-4 h-4 text-[#e74c3c]" />
              </div>
              <h3 className="text-2xl font-black text-[#e74c3c]">18,500,000 đ</h3>
              <span className="text-[11px] text-slate-400">Sẵn sàng để rút về ngân hàng</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Điểm đánh giá trung bình</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              </div>
              <h3 className="text-2xl font-black text-[#2c3e50]">4.9 / 5.0</h3>
              <span className="text-[11px] text-slate-400">Từ 1,240 đánh giá</span>
            </div>
          </div>

          {/* Revenue Chart Visualizer Mockup */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#2c3e50]">Biểu đồ Doanh thu 6 Tháng Gần Nhất (VND)</h3>
                <p className="text-xs text-slate-500">Được trích xuất từ order-service & payment-service</p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                Tăng trưởng +28%
              </span>
            </div>

            <div className="h-44 flex items-end justify-between gap-4 pt-8 px-4 border-b border-slate-100">
              {[
                { month: 'T4/26', amount: 38000000, height: '55%' },
                { month: 'T5/26', amount: 44000000, height: '65%' },
                { month: 'T6/26', amount: 51000000, height: '75%' },
                { month: 'T7/26', amount: 49000000, height: '70%' },
                { month: 'T8/26', amount: 58000000, height: '85%' },
                { month: 'T9/26', amount: 64500000, height: '95%' }
              ].map(bar => (
                <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(bar.amount / 1000000).toFixed(1)}M
                  </span>
                  <div 
                    className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-[#2c3e50] to-[#e74c3c] group-hover:brightness-110 transition-all cursor-pointer"
                    style={{ height: bar.height }}
                  />
                  <span className="text-xs font-semibold text-slate-600">{bar.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURRICULUM BUILDER */}
      {activeTab === 'curriculum' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[#2c3e50]">Soạn Giáo Trình Trực Quan (Curriculum Builder)</h3>
              <p className="text-xs text-slate-500">Quản lý chương mục, thêm bài giảng video HLS hoặc ngân hàng câu hỏi Quiz</p>
            </div>

            {/* Add Section Form */}
            <form onSubmit={handleAddSection} className="flex items-center gap-2">
              <input
                type="text"
                value={newSectionTitle}
                onChange={e => setNewSectionTitle(e.target.value)}
                placeholder="Nhập tiêu đề chương mới..."
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#2c3e50]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#2c3e50] hover:bg-[#1a252f] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm chương
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div key={section.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-[#2c3e50] text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-sm text-[#2c3e50]">{section.title}</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{section.lessons.length} bài học</span>
                </div>

                <div className="space-y-2 pl-8">
                  {section.lessons.map((lesson, lIdx) => (
                    <div key={lesson.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <FileVideo className="w-4 h-4 text-[#e74c3c]" />
                        <span className="font-semibold text-slate-700">{lesson.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 font-mono">
                        <span>{lesson.durationMinutes} phút</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">HLS AES-128</span>
                      </div>
                    </div>
                  ))}

                  {section.quiz && (
                    <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                        <span className="font-bold">{section.quiz.title}</span>
                      </div>
                      <span className="font-semibold">{section.quiz.questions.length} câu trắc nghiệm</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="text-xs text-[#2c3e50] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#e74c3c]" />
                      Thêm bài giảng Video mới
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MINIO VIDEO UPLOAD */}
      {activeTab === 'upload' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h3 className="font-bold text-base text-[#2c3e50]">Tải Video Lên Cụm MinIO Storage & Mã Hóa HLS AES-128</h3>
            <p className="text-xs text-slate-500 mt-1">
              Trình duyệt gửi yêu cầu đến Media-Service để nhận Presigned PUT URL, sau đó tải trực tiếp lên MinIO. FFmpeg worker sẽ tự động bẻ chunk .ts và mã hóa.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề bài giảng cần cập nhật video:
              </label>
              <input
                type="text"
                value={selectedLessonTitle}
                onChange={e => setSelectedLessonTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
              />
            </div>

            {/* Dropzone mockup */}
            <div 
              onClick={() => {
                if (uploadStatus === 'IDLE' || uploadStatus === 'COMPLETED') {
                  handleSimulateUpload();
                }
              }}
              className="border-2 border-dashed border-slate-300 hover:border-[#e74c3c] bg-slate-50 p-8 rounded-2xl text-center cursor-pointer transition-all space-y-3"
            >
              <div className="w-14 h-14 rounded-full bg-slate-200 mx-auto flex items-center justify-center text-[#2c3e50]">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-xs md:text-sm text-[#2c3e50]">
                  Click để chọn file video .MP4 từ máy tính hoặc bấm bắt đầu tải
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dung lượng tối đa: 2GB • Tự động mã hóa phân đoạn chuẩn HLS AES-128
                </p>
              </div>
            </div>

            {/* Progress & Processing States */}
            {uploadStatus !== 'IDLE' && (
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">
                    {uploadStatus === 'GETTING_PRESIGNED' && '1/3 Đang xin Presigned URL từ media-service:8082...'}
                    {uploadStatus === 'UPLOADING' && `2/3 Đang đẩy trực tiếp lên MinIO S3 bucket (${uploadProgress}%)...`}
                    {uploadStatus === 'FFMPEG_PROCESSING' && '3/3 Đang xử lý tối ưu hóa video (FFmpeg Transcoding & AES-128 Key)...'}
                    {uploadStatus === 'COMPLETED' && '✓ Video đã mã hóa thành công & sẵn sàng phát HLS!'}
                  </span>
                  <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                {uploadStatus === 'FFMPEG_PROCESSING' && (
                  <div className="p-2.5 bg-amber-950/60 border border-amber-700/60 rounded-lg text-amber-200 text-[11px] flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Worker FFmpeg đang phân đoạn m3u8 và nhúng khóa AES-128 16-bytes...</span>
                  </div>
                )}

                {uploadStatus === 'COMPLETED' && (
                  <div className="p-2.5 bg-emerald-950/80 border border-emerald-700 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hoàn tất! Thông báo SSE (Server-Sent Events) đã được bắn đến học viên.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: WALLET & PAYOUTS */}
      {activeTab === 'payouts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Request Payout Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#2c3e50] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#e74c3c]" />
              Tạo Yêu Cầu Rút Tiền (PayoutRequest)
            </h3>
            <p className="text-xs text-slate-500">
              Số dư khả dụng: <strong className="text-[#e74c3c] text-sm">18,500,000 đ</strong>
            </p>

            {payoutSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-medium">
                {payoutSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreatePayoutRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số tiền cần rút (VNĐ):
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-[#2c3e50]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngân hàng thụ hưởng:
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số tài khoản:
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Gửi Yêu Cầu Chờ Phê Duyệt
              </button>
            </form>
          </div>

          {/* Right: Payout History Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#2c3e50]">Lịch Sử Yêu Cầu Rút Tiền</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Mã GD</th>
                    <th className="p-3">Số tiền</th>
                    <th className="p-3">Ngân hàng</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payoutList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-500">{item.id}</td>
                      <td className="p-3 font-bold text-[#2c3e50]">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}
                      </td>
                      <td className="p-3 text-slate-600">{item.bankName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status === 'APPROVED' ? 'Đã duyệt chi' : 'Chờ Admin duyệt'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{item.requestedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
