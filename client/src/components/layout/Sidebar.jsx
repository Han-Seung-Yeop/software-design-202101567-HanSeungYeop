import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Activity,
  Heart,
  Star,
  MessageSquare,
  MessageCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const teacherMenu = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/students', label: '학생 관리', icon: Users },
  { to: '/grades', label: '성적 관리', icon: BookOpen },
  { to: '/attendances', label: '출결 관리', icon: Calendar },
  { to: '/behaviors', label: '행동 관리', icon: Activity },
  { to: '/attitudes', label: '태도 관리', icon: Heart },
  { to: '/special-notes', label: '특기사항', icon: Star },
  { to: '/feedbacks', label: '피드백 관리', icon: MessageSquare },
  { to: '/counselings', label: '상담 관리', icon: MessageCircle },
];

const studentMenu = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/grades', label: '내 성적', icon: BookOpen },
  { to: '/attendances', label: '내 출결', icon: Calendar },
  { to: '/behaviors', label: '내 행동', icon: Activity },
  { to: '/attitudes', label: '내 태도', icon: Heart },
  { to: '/special-notes', label: '내 특기사항', icon: Star },
  { to: '/feedbacks', label: '내 피드백', icon: MessageSquare },
];

const parentMenu = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/grades', label: '자녀 성적', icon: BookOpen },
  { to: '/attendances', label: '자녀 출결', icon: Calendar },
  { to: '/behaviors', label: '자녀 행동', icon: Activity },
  { to: '/attitudes', label: '자녀 태도', icon: Heart },
  { to: '/special-notes', label: '자녀 특기사항', icon: Star },
  { to: '/feedbacks', label: '자녀 피드백', icon: MessageSquare },
  { to: '/counselings', label: '자녀 상담', icon: MessageCircle },
];

const menuByRole = {
  teacher: teacherMenu,
  student: studentMenu,
  parent: parentMenu,
};

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const menu = menuByRole[user?.role] || teacherMenu;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-indigo-900 text-white z-30 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:block`}
      >
        {/* Logo / Title */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-800">
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">학생 관리 시스템</h2>
            <p className="text-xs text-indigo-300 mt-0.5">Student Management</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-indigo-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {menu.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-700 text-white'
                      : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
