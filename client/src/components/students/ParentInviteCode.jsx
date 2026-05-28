import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { toast } from '../common/Toast';
import { Key, RefreshCw, Copy } from 'lucide-react';

const MAX_PARENTS = 2;

export default function ParentInviteCode() {
  const { user } = useAuth();
  const linkedCount = user?.profile?.parent_ids?.length || 0;
  const reachedLimit = linkedCount >= MAX_PARENTS;

  const [code, setCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);

  const issueCode = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/parent-invitations');
      setCode(data.data.code);
      setExpiresAt(data.data.expires_at);
    } catch (err) {
      toast.error(err.response?.data?.message || '코드 발급 실패');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const el = document.createElement('textarea');
        el.value = code;
        el.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      toast.success('코드 복사됨');
    } catch {
      toast.error('복사 실패');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Key size={18} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-800">학부모 연결 코드</h2>
        </div>
        <span className="text-xs text-gray-500">
          연결됨: <strong className={reachedLimit ? 'text-red-600' : 'text-indigo-600'}>{linkedCount}</strong> / {MAX_PARENTS}명
        </span>
      </div>

      {reachedLimit ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-800">
            최대 {MAX_PARENTS}명까지 연결 가능합니다. 더 이상 코드를 발급할 수 없습니다.
          </p>
        </div>
      ) : code ? (
        <div className="space-y-3">
          <div className="bg-indigo-50 border-2 border-indigo-200 border-dashed rounded-lg p-6 text-center">
            <div className="text-4xl font-mono tracking-[0.4em] font-bold text-indigo-700">
              {code}
            </div>
            <div className="text-xs text-indigo-600 mt-2">
              유효 기간: {new Date(expiresAt).toLocaleString('ko-KR')}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyCode}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Copy size={14} /> 코드 복사
            </button>
            <button
              onClick={issueCode}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60 transition-colors"
            >
              <RefreshCw size={14} /> 새 코드
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            이 코드를 학부모님께 전달하세요. 학부모님이 Google 로그인 후 이 코드를 입력하면 자동으로 연결됩니다. (1회용)
          </p>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-4">
            학부모님과 계정을 연결하려면 코드를 발급하세요.
          </p>
          <button
            onClick={issueCode}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
          >
            {loading ? '발급 중...' : '학부모 연결 코드 발급'}
          </button>
        </div>
      )}
    </div>
  );
}
