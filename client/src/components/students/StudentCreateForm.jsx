import { useState } from 'react';
import api from '../../api/axios';
import { toast } from '../common/Toast';

export default function StudentCreateForm({ onSuccess, onCancel, defaultGradeYear, defaultClassNum }) {
  const [form, setForm] = useState({
    email: '',
    name: '',
    grade_year: defaultGradeYear || '',
    class_num: defaultClassNum || '',
    student_num: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.grade_year || !form.class_num || !form.student_num) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/students', {
        email: form.email,
        name: form.name,
        grade_year: Number(form.grade_year),
        class_num: Number(form.class_num),
        student_num: Number(form.student_num),
      });
      toast.success(`${form.name} 학생이 사전 등록되었습니다.`);
      onSuccess?.(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || '등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        💡 등록한 이메일과 일치하는 Google 계정으로 OAuth 로그인 시 자동으로 학생 권한이 부여됩니다.
      </div>

      <Field
        label="이메일 *"
        type="email"
        value={form.email}
        onChange={handleChange('email')}
        placeholder="student@example.com"
      />
      <Field label="이름 *" value={form.name} onChange={handleChange('name')} placeholder="홍길동" />

      <div className="grid grid-cols-3 gap-3">
        <Field label="학년 *" type="number" value={form.grade_year} onChange={handleChange('grade_year')} placeholder="2" />
        <Field label="반 *" type="number" value={form.class_num} onChange={handleChange('class_num')} placeholder="3" />
        <Field label="번호 *" type="number" value={form.student_num} onChange={handleChange('student_num')} placeholder="15" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60 transition-colors"
        >
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
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
