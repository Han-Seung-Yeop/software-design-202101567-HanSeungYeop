import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/common/Toast';

/**
 * OAuth 콜백 결과 페이지.
 * 백엔드가 redirect한 URL: /oauth/success?at=...&rt=...&next=...
 * 또는: /oauth/parent-link?at=...&rt=...
 *
 * 1. 토큰을 localStorage에 저장
 * 2. /auth/me 호출해서 user/profile 가져오기
 * 3. user.role 따라 분기
 *    - role 있으면 → 대시보드 (/)
 *    - role 없으면 → 학부모 코드 입력 (/parent-link)
 */
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { saveTokens, fetchUser } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const at = params.get('at');
    const rt = params.get('rt');

    if (!at || !rt) {
      toast.error('OAuth 응답이 올바르지 않습니다.');
      navigate('/oauth/error?reason=missing_tokens', { replace: true });
      return;
    }

    saveTokens(at, rt);

    fetchUser()
      .then(({ user }) => {
        if (user.role) {
          navigate('/', { replace: true });
        } else {
          navigate('/parent-link', { replace: true });
        }
      })
      .catch(() => {
        navigate('/oauth/error?reason=fetch_user_failed', { replace: true });
      });
  }, [params, saveTokens, fetchUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}
