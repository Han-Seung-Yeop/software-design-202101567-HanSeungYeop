import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import { UserPlus, Trash2, CheckCircle, Clock } from 'lucide-react';

const ROLE_BADGE = (active) =>
  active
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

export default function TeacherRegister() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    name: '',
    department: '',
    position: '',
    grade_year: '',
    class_num: '',
  });

  // super_admin이 아니면 대시보드로 redirect (백엔드 403도 안전장치)
  if (user && !user.profile?.is_super_admin) {
    return <Navigate to="/" replace />;
  }

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/admin/teachers');
      setTeachers(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || '교사 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name) {
      toast.error('이메일과 이름은 필수입니다.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/teachers', {
        email: form.email,
        name: form.name,
        department: form.department || undefined,
        position: form.position || undefined,
        grade_year: form.grade_year ? Number(form.grade_year) : undefined,
        class_num: form.class_num ? Number(form.class_num) : undefined,
      });
      toast.success('교사 사전 등록 완료');
      setForm({ email: '', name: '', department: '', position: '', grade_year: '', class_num: '' });
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || '등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까? (활성화 전 record만 삭제 가능)')) return;
    try {
      await api.delete(`/admin/teachers/${id}`);
      toast.success('삭제됨');
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || '삭제 실패');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">교사 사전 등록</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        💡 등록한 이메일과 일치하는 Google 계정으로 OAuth 로그인 시 자동으로 교사 권한이 부여됩니다.
        <br />
        등록되지 않은 이메일은 교사로 가입할 수 없습니다.
      </div>

      {/* 등록 폼 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={18} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">새 교사 등록</h2>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="이메일 *" type="email" value={form.email} onChange={handleChange('email')} placeholder="teacher@example.com" />
          <Field label="이름 *" value={form.name} onChange={handleChange('name')} placeholder="김교사" />
          <Field label="부서" value={form.department} onChange={handleChange('department')} placeholder="수학과" />
          <Field label="직책" value={form.position} onChange={handleChange('position')} placeholder="담임교사" />
          <Field label="담당 학년" type="number" value={form.grade_year} onChange={handleChange('grade_year')} placeholder="2" />
          <Field label="담당 반" type="number" value={form.class_num} onChange={handleChange('class_num')} placeholder="3" />
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-60 transition-colors"
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>

      {/* 등록된 교사 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            등록된 교사 <span className="text-sm text-gray-400 font-normal">({teachers.length}명)</span>
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>이름</Th>
                  <Th>이메일</Th>
                  <Th>부서/직책</Th>
                  <Th>담당</Th>
                  <Th>상태</Th>
                  <Th>액션</Th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t._id} className="border-t border-gray-100">
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {t.is_super_admin && <span className="text-yellow-500">👑</span>}
                        <span className="font-medium">{t.name}</span>
                      </div>
                    </Td>
                    <Td className="text-gray-600">{t.email}</Td>
                    <Td className="text-gray-600">
                      {t.department || '-'} / {t.position || '-'}
                    </Td>
                    <Td className="text-gray-600">
                      {t.grade_year && t.class_num ? `${t.grade_year}-${t.class_num}` : '-'}
                    </Td>
                    <Td>
                      <span className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 ${ROLE_BADGE(!!t.user_id)}`}>
                        {t.user_id ? (
                          <>
                            <CheckCircle size={12} /> 활성화
                          </>
                        ) : (
                          <>
                            <Clock size={12} /> 사전 등록
                          </>
                        )}
                      </span>
                    </Td>
                    <Td>
                      {!t.is_super_admin && !t.user_id && (
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">등록된 교사가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>;
}

function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
