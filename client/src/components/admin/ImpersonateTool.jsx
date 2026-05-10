import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from '../common/Toast';
import { Wrench, RotateCcw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ROLE_LABEL = {
  teacher: '교사',
  student: '학생',
  parent: '학부모',
};

export default function ImpersonateTool() {
  // 운영 빌드에선 컴포넌트 자체를 렌더링 안 함
  if (import.meta.env.VITE_DEV_MODE !== 'true') return null;

  const { user, fetchUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  // super_admin 본인 외엔 표시 안 함
  const isSuperAdmin = user?.profile?.is_super_admin === true;

  // 현재 변신 중인지 확인 (originalToken이 있으면 변신 모드)
  const isImpersonating = !!localStorage.getItem('originalToken');

  useEffect(() => {
    if (!isSuperAdmin || isImpersonating) return;
    api
      .get('/auth/impersonate/users')
      .then((res) => setUsers(res.data.data || []))
      .catch(() => {
        // dev 모드 아니거나 에러 → 무시
      });
  }, [isSuperAdmin, isImpersonating]);

  const handleImpersonate = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const orig = localStorage.getItem('accessToken');
      const { data } = await api.post('/auth/impersonate', { user_id: selected });

      localStorage.setItem('originalToken', orig);
      localStorage.setItem('accessToken', data.data.accessToken);

      toast.success(`${data.data.impersonating.name}으(로) 변신했습니다.`);
      // 리로드해서 user state 갱신
      window.location.href = '/';
    } catch (err) {
      toast.error(err.response?.data?.message || '변신 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    const orig = localStorage.getItem('originalToken');
    if (!orig) return;
    localStorage.setItem('accessToken', orig);
    localStorage.removeItem('originalToken');
    toast.success('원래 계정으로 복귀했습니다.');
    window.location.href = '/';
  };

  // 변신 중이면 "복귀" 배너만 표시
  if (isImpersonating) {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wrench size={18} className="text-amber-700" />
          <span className="text-sm text-amber-800 font-medium">
            🔧 시연 모드: <strong>{user?.name}</strong>({ROLE_LABEL[user?.role] || user?.role})으로 변신 중
          </span>
        </div>
        <button
          onClick={handleRestore}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white hover:bg-gray-50 border border-amber-400 text-amber-800 rounded-lg transition-colors"
        >
          <RotateCcw size={14} />
          원래 계정으로 복귀
        </button>
      </div>
    );
  }

  // super_admin 아니면 안 보임
  if (!isSuperAdmin) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Wrench size={18} className="text-yellow-700" />
        <h3 className="text-sm font-semibold text-yellow-900">
          시연 도구 (개발 모드)
        </h3>
      </div>
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-white"
        >
          <option value="">사용자 선택</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({ROLE_LABEL[u.role] || u.role}) — {u.email}
            </option>
          ))}
        </select>
        <button
          onClick={handleImpersonate}
          disabled={!selected || loading}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '변신 중...' : '변신'}
        </button>
      </div>
      <p className="text-xs text-yellow-700 mt-2">
        ⚠️ 운영 환경에선 이 도구가 비활성화됩니다 (NODE_ENV=production).
      </p>
    </div>
  );
}
