import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const roleLabels = {
  teacher: '교사',
  student: '학생',
  parent: '학부모',
};

const roleBadgeColors = {
  teacher: 'bg-indigo-100 text-indigo-800',
  student: 'bg-green-100 text-green-800',
  parent: 'bg-orange-100 text-orange-800',
};

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-800 hidden sm:block">
          학생 성적 및 상담 관리 시스템
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-sm text-gray-700 font-medium">{user.name}</span>
            {user.role === 'parent' && user.profile?.student_ids?.length > 0 ? (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-800">
                {user.profile.student_ids.map(s =>
                  `${s.grade_year}학년 ${s.class_num}반 ${s.student_num}번 ${s.user_id?.name || ''}`
                ).join(', ')}의 학부모
              </span>
            ) : (
              <>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleBadgeColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                  {roleLabels[user.role] || user.role}
                </span>
                {user.role === 'teacher' && user.profile?.grade_year && user.profile?.class_num && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                    {user.profile.grade_year}학년 {user.profile.class_num}반 담임
                  </span>
                )}
                {user.role === 'student' && user.profile?.grade_year && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
                    {user.profile.grade_year}학년 {user.profile.class_num}반 {user.profile.student_num}번
                  </span>
                )}
              </>
            )}
          </>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </div>
    </header>
  );
}
