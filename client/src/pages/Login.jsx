import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap } from 'lucide-react';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered;

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginId, password);
      // navigate는 useEffect의 user 감지로 처리
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-700 px-8 py-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <GraduationCap size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">학생 성적 및 상담 관리 시스템</h1>
          <p className="text-indigo-200 text-sm mt-1">Student Management System</p>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">로그인</h2>

          {justRegistered && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              회원가입이 완료되었습니다. 로그인해주세요.
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                placeholder="아이디를 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              )}
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
