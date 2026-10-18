import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, Download, AlertCircle, Loader2, Link2, CheckCircle2 } from 'lucide-react';
import { lessonAttachmentApi, type LessonAttachmentItem } from '../../api/lessonAttachmentApi';

interface LessonAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
}

export const LessonAttachmentsModal: React.FC<LessonAttachmentsModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
}) => {
  const [attachments, setAttachments] = useState<LessonAttachmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form add new attachment
  const [name, setName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAttachments = async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await lessonAttachmentApi.getAttachments(lessonId);
      setAttachments(data || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách tài liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && lessonId) {
      void fetchAttachments();
      setName('');
      setFileUrl('');
      setFileSize('');
      setFileType('PDF');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, lessonId]);

  if (!isOpen) return null;

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên tài liệu.');
      return;
    }
    if (!fileUrl.trim()) {
      setError('Vui lòng nhập đường dẫn liên kết tải tài liệu.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const created = await lessonAttachmentApi.addAttachment(lessonId, {
        name: name.trim(),
        fileUrl: fileUrl.trim(),
        fileSize: fileSize.trim() || undefined,
        fileType: fileType.trim().toUpperCase() || undefined,
      });

      setAttachments(prev => [...prev, created]);
      setName('');
      setFileUrl('');
      setFileSize('');
      setSuccessMsg('Đã thêm tài liệu đính kèm thành công.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể thêm tài liệu đính kèm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (attachmentId: string, attachmentName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài liệu "${attachmentName}"?`)) return;

    setDeletingId(attachmentId);
    setError(null);
    try {
      await lessonAttachmentApi.deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(item => item.id !== attachmentId));
      setSuccessMsg(`Đã xóa tài liệu "${attachmentName}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa tài liệu.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#e74c3c] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tài liệu đính kèm bài học</h3>
              <p className="text-xs text-slate-500 truncate max-w-sm">{lessonTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form thêm tài liệu mới */}
          <form onSubmit={handleAddAttachment} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#e74c3c]" />
              Thêm tài liệu mới cho bài học
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tên tài liệu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Slide bài giảng Buổi 1, Source code bài tập, Tài liệu PDF..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#e74c3c]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Đường dẫn liên kết tải file (URL) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="url"
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... hoặc link lưu trữ MinIO/S3"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#e74c3c]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Định dạng
                </label>
                <select
                  value={fileType}
                  onChange={e => setFileType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#e74c3c]"
                >
                  <option value="PDF">Tài liệu PDF (.pdf)</option>
                  <option value="ZIP">File nén (.zip, .rar)</option>
                  <option value="SLIDES">Slide thuyết trình (.pptx)</option>
                  <option value="DOC">Văn bản (.docx, .txt)</option>
                  <option value="CODE">Mã nguồn (Source Code)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Dung lượng (tùy chọn)
                </label>
                <input
                  type="text"
                  value={fileSize}
                  onChange={e => setFileSize(e.target.value)}
                  placeholder="VD: 3.2 MB, 150 KB"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#e74c3c]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting || !name.trim() || !fileUrl.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Lưu tài liệu
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Danh sách tài liệu hiện có */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Danh sách tài liệu đã đính kèm ({attachments.length})
            </h4>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#e74c3c]" />
                <span className="text-xs">Đang tải danh sách tài liệu...</span>
              </div>
            ) : attachments.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Bài học này chưa có tài liệu nào.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-[#e74c3c] font-mono text-[10px] font-bold border border-rose-200">
                        {item.fileType || 'FILE'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                        <span className="text-[10px] text-slate-400">
                          {item.fileSize ? `Dung lượng: ${item.fileSize}` : 'Tài liệu liên kết'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-[#e74c3c] hover:bg-slate-100 rounded-lg transition"
                        title="Tải về / Xem thử"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={deletingId === item.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                        title="Xóa tài liệu"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
