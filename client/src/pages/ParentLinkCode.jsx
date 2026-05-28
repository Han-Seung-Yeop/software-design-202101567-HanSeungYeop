import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';
import { Users, ArrowRight } from 'lucide-react';

export default function ParentLinkCode() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { saveTokens, fetchUser, logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      toast.error('6자리 코드를 입력해주세요.');
      return;
    }
    if (!name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/parent-link', { code: trimmed, name: name.trim() });
      saveTokens(data.data.accessToken, data.data.refreshToken);
      toast.success(`${data.data.student.name} 학생의 학부모로 연결되었습니다.`);
      await fetchUser();
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || '연결 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <Users size={32} className="text-orange-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800 text-center mb-2">자녀 연결</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          자녀가 발급한 6자리 연결 코드를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="이름 입력 (예: 김영희)"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            autoFocus
          />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="A8F3K2"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-2xl font-mono tracking-[0.4em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? '연결 중...' : (
              <>
                연결하기 <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => { logout(); navigate('/login', { replace: true }); }}
          className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          취소하고 로그아웃
        </button>

        <p className="text-xs text-gray-400 text-center mt-6">
          코드는 자녀가 학생 대시보드에서 발급할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
