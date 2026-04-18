import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap } from 'lucide-react';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({
    login_id: '',
    password: '',
    passwordConfirm: '',
    name: '',
    role: 'teacher',
    department: '',
    position: '',
    isHomeroom: false,
    grade_year: 1,
    class_num: 1,
    student_num: 1,
    phone: '',
    child_name: '',
    child_grade_year: '',
    child_class_num: '',
    child_num: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const { passwordConfirm, isHomeroom, ...payload } = form;
      if (payload.role === 'teacher' && !isHomeroom) {
        delete payload.grade_year;
        delete payload.class_num;
      }
      if (payload.role !== 'parent') {
        delete payload.child_name;
        delete payload.child_grade_year;
        delete payload.child_class_num;
        delete payload.child_num;
      }
      await api.post('/auth/register', payload);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4 py-8">
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
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">회원가입</h2>

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
                name="login_id"
                value={form.login_id}
                onChange={handleChange}
                required
                placeholder="아이디를 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="6자 이상 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <input
                type="password"
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                required
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="teacher">교사</option>
                <option value="student">학생</option>
                <option value="parent">학부모</option>
              </select>
            </div>

            {/* 교사 추가 필드 */}
            {form.role === 'teacher' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                  <input
                    type="text"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="예: 수학과"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
                  <input
                    type="text"
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    placeholder="예: 담임교사"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isHomeroom"
                    id="isHomeroom"
                    checked={form.isHomeroom}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isHomeroom" className="text-sm font-medium text-gray-700">담임교사</label>
                </div>
                {form.isHomeroom && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">담당 학년</label>
                      <input
                        type="number"
                        name="grade_year"
                        value={form.grade_year}
                        onChange={handleChange}
                        min={1}
                        max={6}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">담당 반</label>
                      <input
                        type="number"
                        name="class_num"
                        value={form.class_num}
                        onChange={handleChange}
                        min={1}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 학생 추가 필드 */}
            {form.role === 'student' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                    <input
                      type="number"
                      name="grade_year"
                      value={form.grade_year}
                      onChange={handleChange}
                      min={1}
                      max={6}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">반</label>
                    <input
                      type="number"
                      name="class_num"
                      value={form.class_num}
                      onChange={handleChange}
                      min={1}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">번호</label>
                    <input
                      type="number"
                      name="student_num"
                      value={form.student_num}
                      onChange={handleChange}
                      min={1}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 학부모 추가 필드 */}
            {form.role === 'parent' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="예: 010-1234-5678"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">자녀 정보</p>
                  <p className="text-xs text-gray-500 mb-3">자녀의 이름과 학년/반/번호를 정확히 입력해주세요. 입력한 정보가 학생 등록 정보와 일치해야 연결됩니다.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">자녀 이름</label>
                      <input
                        type="text"
                        name="child_name"
                        value={form.child_name}
                        onChange={handleChange}
                        placeholder="자녀의 이름"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">학년</label>
                        <input
                          type="number"
                          name="child_grade_year"
                          value={form.child_grade_year}
                          onChange={handleChange}
                          min={1}
                          max={6}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">반</label>
                        <input
                          type="number"
                          name="child_class_num"
                          value={form.child_class_num}
                          onChange={handleChange}
                          min={1}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">번호</label>
                        <input
                          type="number"
                          name="child_num"
                          value={form.child_num}
                          onChange={handleChange}
                          min={1}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              )}
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
