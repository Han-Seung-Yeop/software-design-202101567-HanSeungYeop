import { useState, useRef, useEffect } from 'react';
import { FileDown, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import { toast } from '../common/Toast';

const reports = [
  { type: 'grades', label: '성적 분석 보고서' },
  { type: 'counselings', label: '상담 내역 보고서' },
  { type: 'feedbacks', label: '피드백 요약 보고서' },
];

const extractFilename = (disposition, fallback) => {
  if (!disposition) return fallback;
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/i) || disposition.match(/filename="?([^";]+)"?/i);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return fallback;
};

const triggerBrowserDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function ReportDownloadButton({ studentId }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleDownload = async (type, format) => {
    if (!studentId) return;
    const key = `${type}-${format}`;
    setDownloading(key);
    setOpen(false);
    try {
      const res = await api.get(`/reports/${type}`, {
        params: { student_id: studentId, format },
        responseType: 'blob',
      });
      const filename = extractFilename(
        res.headers['content-disposition'],
        `report_${type}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      );
      triggerBrowserDownload(res.data, filename);
      toast.success('보고서 다운로드를 시작합니다.');
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        toast.error('해당 학생의 보고서를 다운로드할 권한이 없습니다.');
      } else {
        toast.error('보고서 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!!downloading}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:bg-gray-300"
      >
        <FileDown size={16} />
        <span>보고서 다운로드</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-40 overflow-hidden">
          {reports.map((r, idx) => (
            <div key={r.type} className={idx > 0 ? 'border-t border-gray-100' : ''}>
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">{r.label}</p>
              <button
                onClick={() => handleDownload(r.type, 'excel')}
                disabled={downloading === `${r.type}-excel`}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-green-600" />
                <span>Excel 다운로드</span>
                {downloading === `${r.type}-excel` && (
                  <span className="ml-auto text-xs text-gray-400">생성 중...</span>
                )}
              </button>
              <button
                onClick={() => handleDownload(r.type, 'pdf')}
                disabled={downloading === `${r.type}-pdf`}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
              >
                <FileText size={16} className="text-red-600" />
                <span>PDF 다운로드</span>
                {downloading === `${r.type}-pdf` && (
                  <span className="ml-auto text-xs text-gray-400">생성 중...</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
