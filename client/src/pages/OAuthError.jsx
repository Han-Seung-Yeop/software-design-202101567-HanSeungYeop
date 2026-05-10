import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const REASON_MESSAGES = {
  email_required: '이메일 정보가 필요합니다. 다시 시도해주세요.',
  email_not_verified: 'Google 계정의 이메일이 인증되지 않았습니다.',
  auth_failed: 'Google 인증에 실패했습니다.',
  missing_tokens: '인증 토큰이 누락되었습니다.',
  fetch_user_failed: '사용자 정보를 가져오지 못했습니다.',
  server_error: '서버 오류가 발생했습니다.',
};

export default function OAuthError() {
  const [params] = useSearchParams();
  const reason = params.get('reason') || 'unknown';
  const message = REASON_MESSAGES[reason] || '알 수 없는 오류가 발생했습니다.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertCircle size={32} className="text-red-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">로그인 실패</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <p className="text-xs text-gray-400 mb-4">오류 코드: {reason}</p>
        <Link
          to="/login"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          로그인 페이지로
        </Link>
      </div>
    </div>
  );
}
